import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormArray, ReactiveFormsModule } from '@angular/forms';
import { ClienteSelectorComponent } from '../cliente-selector/cliente-selector.component';
import { Cliente, TipoVenta, TipoPago, Medida } from '../../../../../../interfaces';
import { ProductoInventario } from '../../../../../../services/venta.service';
import { MedidaService } from '../../../../../../services/medida.service';

@Component({
    selector: 'app-shopping-cart',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, ClienteSelectorComponent],
    templateUrl: './shopping-cart.component.html',
})
export class ShoppingCartComponent implements OnChanges, OnInit {
    @Input() parentForm!: FormGroup;
    @Input() clientes: Cliente[] = [];
    @Input() isLoading: boolean = false;
    @Input() productosInventario: ProductoInventario[] = [];
    @Input() tiposVenta: TipoVenta[] = [];
    @Input() tiposPago: TipoPago[] = [];
    @Output() remove = new EventEmitter<number>();

    unidadesMedida: string[] = ['Unidad']; // Default fallback

    constructor(private medidaService: MedidaService) { }

    ngOnInit(): void {
        this.loadMedidas();
    }

    loadMedidas(): void {
        this.medidaService.getAll().subscribe({
            next: (response: any) => {
                const medidas = Array.isArray(response) ? response : (response.data || []);
                this.unidadesMedida = medidas.map((m: Medida) => m.nombre_medida);
            },
            error: (error) => console.error('Error loading medidas:', error)
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['tiposVenta'] && this.tiposVenta) {
            console.log('ShoppingCart - Tipos Venta received:', this.tiposVenta);
        }
        if (changes['tiposPago'] && this.tiposPago) {
            console.log('ShoppingCart - Tipos Pago received:', this.tiposPago);
        }
    }

    get detalles() {
        return this.parentForm.get('detalles') as FormArray;
    }

    trackByIndex(index: number): number {
        return index;
    }

    removeDetalle(index: number): void {
        this.remove.emit(index);
    }

    getArticuloNombre(articuloId: number): string {
        const producto = this.productosInventario.find(p => p.articulo_id === articuloId);
        return producto?.articulo?.nombre || 'N/A';
    }

    getStockDisponible(articuloId: number): number {
        const producto = this.productosInventario.find(p => p.articulo_id === articuloId);
        return producto?.stock_disponible || 0;
    }

    seleccionarTipoVenta(tipoVentaId: number): void {
        this.parentForm.patchValue({ tipo_venta_id: tipoVentaId });
        this.parentForm.get('tipo_venta_id')?.updateValueAndValidity();
    }

    seleccionarTipoPago(tipoPagoId: number): void {
        this.parentForm.patchValue({ tipo_pago_id: tipoPagoId });
        this.parentForm.get('tipo_pago_id')?.updateValueAndValidity();
    }

    isContado(tipo: any): boolean {
        const nombre = (tipo.nombre_tipo_ventas || tipo.nombre || '').toLowerCase();
        return nombre.includes('contado') || nombre.includes('efectivo') || nombre.includes('cash');
    }

    isCredito(tipo: any): boolean {
        const nombre = (tipo.nombre_tipo_ventas || tipo.nombre || '').toLowerCase();
        return nombre.includes('credito') || nombre.includes('crédito');
    }

    isTarjeta(tipo: any): boolean {
        const nombre = (tipo.nombre_tipo_ventas || tipo.nombre || '').toLowerCase();
        return nombre.includes('tarjeta') || nombre.includes('card');
    }

    isQr(tipo: any): boolean {
        const nombre = (tipo.nombre_tipo_pago || tipo.nombre || '').toLowerCase();
        return nombre.includes('qr') || nombre.includes('qrcode');
    }

    isDefaultVenta(tipo: any): boolean {
        return !this.isContado(tipo) && !this.isCredito(tipo) && !this.isTarjeta(tipo);
    }

    isDefaultPago(tipo: any): boolean {
        return !this.isQr(tipo) && !this.isContado(tipo) && !this.isTarjeta(tipo);
    }

    cambiarUnidad(index: number, unidad: string): void {
        const detalle = this.detalles.at(index);
        const articuloId = detalle.get('articulo_id')?.value;
        const producto = this.productosInventario.find(p => p.articulo_id === articuloId);

        if (producto && producto.articulo) {
            let nuevoPrecio = producto.articulo.precio_venta;

            if (unidad === 'Paquete') {
                nuevoPrecio = producto.articulo.precio_costo_paq > 0
                    ? producto.articulo.precio_costo_paq
                    : (producto.articulo.precio_venta * (producto.articulo.unidad_envase || 1));
            } else if (unidad === 'Centimetro') {
                nuevoPrecio = producto.articulo.precio_venta / 100;
            }

            detalle.patchValue({ precio: nuevoPrecio });
        }
    }
}
