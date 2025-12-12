import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KardexService } from '../../../services/kardex.service';
import { ArticuloService } from '../../../services/articulo.service';
import { AlmacenService } from '../../../services/almacen.service';
import { Kardex, Articulo, Almacen } from '../../../interfaces';

@Component({
    selector: 'app-ajustes-inventario',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './ajustes-inventario.component.html'
})
export class AjustesInventarioComponent implements OnInit {
    // Datos
    ajustes: Kardex[] = [];
    articulos: Articulo[] = [];
    almacenes: Almacen[] = [];

    // Modal
    showModal = false;

    // Formulario
    ajuste = {
        fecha: new Date().toISOString().split('T')[0],
        tipo_movimiento: 'ajuste',
        articulo_id: null as number | null,
        almacen_id: null as number | null,
        tipo_ajuste: 'entrada' as 'entrada' | 'salida',
        cantidad: 0,
        costo_unitario: 0,
        motivo: '',
        observaciones: ''
    };

    // Estados
    isLoading = false;
    isSaving = false;
    stockDisponible = 0;

    constructor(
        private kardexService: KardexService,
        private articuloService: ArticuloService,
        private almacenService: AlmacenService
    ) { }

    ngOnInit(): void {
        this.loadData();
    }

    loadData(): void {
        this.loadArticulos();
        this.loadAlmacenes();
        this.loadAjustes();
    }

    loadArticulos(): void {
        this.articuloService.getAll().subscribe({
            next: (response: any) => {
                this.articulos = Array.isArray(response) ? response : (response.data || []);
            },
            error: (error) => console.error('Error cargando artículos:', error)
        });
    }

    loadAlmacenes(): void {
        this.almacenService.getAll().subscribe({
            next: (response: any) => {
                this.almacenes = Array.isArray(response) ? response : (response.data || []);
            },
            error: (error) => console.error('Error cargando almacenes:', error)
        });
    }

    loadAjustes(): void {
        this.isLoading = true;
        const params = { tipo_movimiento: 'ajuste', per_page: 50 };

        this.kardexService.getPaginated(params).subscribe({
            next: (response) => {
                if (response.data?.data) {
                    this.ajustes = response.data.data;
                }
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error cargando ajustes:', error);
                this.isLoading = false;
            }
        });
    }

    openModal(): void {
        this.resetForm();
        this.showModal = true;
    }

    closeModal(): void {
        this.showModal = false;
        this.resetForm();
    }

    resetForm(): void {
        this.ajuste = {
            fecha: new Date().toISOString().split('T')[0],
            tipo_movimiento: 'ajuste',
            articulo_id: null,
            almacen_id: null,
            tipo_ajuste: 'entrada',
            cantidad: 0,
            costo_unitario: 0,
            motivo: '',
            observaciones: ''
        };
        this.stockDisponible = 0;
    }

    onArticuloChange(): void {
        // Aquí podrías cargar el stock disponible si lo necesitas
        if (this.ajuste.articulo_id) {
            const articulo = this.articulos.find(a => a.id === this.ajuste.articulo_id);
            if (articulo) {
                this.ajuste.costo_unitario = Number(articulo.precio_costo_paq || 0);
            }
        }
    }

    guardarAjuste(): void {
        if (!this.validarFormulario()) {
            return;
        }

        this.isSaving = true;

        const payload: any = {
            fecha: this.ajuste.fecha,
            tipo_movimiento: 'ajuste',
            articulo_id: this.ajuste.articulo_id,
            almacen_id: this.ajuste.almacen_id,
            costo_unitario: this.ajuste.costo_unitario,
            motivo: this.ajuste.motivo,
            observaciones: this.ajuste.observaciones
        };

        if (this.ajuste.tipo_ajuste === 'entrada') {
            payload.cantidad_entrada = this.ajuste.cantidad;
            payload.cantidad_salida = 0;
        } else {
            payload.cantidad_entrada = 0;
            payload.cantidad_salida = this.ajuste.cantidad;
        }

        this.kardexService.create(payload).subscribe({
            next: (response) => {
                alert('Ajuste registrado exitosamente');
                this.closeModal();
                this.loadAjustes();
                this.isSaving = false;
            },
            error: (error) => {
                console.error('Error guardando ajuste:', error);
                alert(error.error?.message || 'Error al guardar el ajuste');
                this.isSaving = false;
            }
        });
    }

    validarFormulario(): boolean {
        if (!this.ajuste.articulo_id) {
            alert('Debe seleccionar un artículo');
            return false;
        }
        if (!this.ajuste.almacen_id) {
            alert('Debe seleccionar un almacén');
            return false;
        }
        if (this.ajuste.cantidad <= 0) {
            alert('La cantidad debe ser mayor a 0');
            return false;
        }
        if (!this.ajuste.motivo) {
            alert('Debe seleccionar un motivo');
            return false;
        }
        return true;
    }

    getColorTipo(tipo: string): string {
        return tipo === 'entrada' ? 'text-green-600' : 'text-red-600';
    }
}
