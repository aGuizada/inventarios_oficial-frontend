import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { DevolucionService } from '../../../../services/devolucion.service';
import { VentaService } from '../../../../services/venta.service';
import { AlmacenService } from '../../../../services/almacen.service';
import { Venta, DetalleVenta, Almacen } from '../../../../interfaces';
import { finalize } from 'rxjs/operators';

@Component({
    selector: 'app-devolucion-form',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        RouterModule
    ],
    templateUrl: './devolucion-form.component.html'
})
export class DevolucionFormComponent implements OnInit {
    devolucionForm: FormGroup;
    isLoading = false;
    isSearchingVenta = false;
    venta: Venta | null = null;
    almacenes: Almacen[] = [];

    constructor(
        private fb: FormBuilder,
        private devolucionService: DevolucionService,
        private ventaService: VentaService,
        private almacenService: AlmacenService,
        private router: Router,
        private route: ActivatedRoute
    ) {
        this.devolucionForm = this.fb.group({
            venta_id: ['', [Validators.required]],
            fecha: [new Date().toISOString().substring(0, 10), [Validators.required]],
            motivo: ['', [Validators.required]],
            observaciones: [''],
            detalles: this.fb.array([])
        });
    }

    ngOnInit(): void {
        this.loadAlmacenes();
        this.route.queryParams.subscribe(params => {
            if (params['venta_id']) {
                this.devolucionForm.patchValue({ venta_id: params['venta_id'] });
                this.buscarVenta();
            }
        });
    }

    get detalles(): FormArray {
        return this.devolucionForm.get('detalles') as FormArray;
    }

    loadAlmacenes(): void {
        this.almacenService.getAll().subscribe(res => {
            if (Array.isArray(res)) {
                this.almacenes = res;
            } else if (res.data) {
                this.almacenes = res.data;
            }
        });
    }

    buscarVenta(): void {
        const ventaId = this.devolucionForm.get('venta_id')?.value;
        if (!ventaId) return;

        this.isSearchingVenta = true;
        this.venta = null;
        this.detalles.clear();

        this.ventaService.getById(ventaId)
            .pipe(finalize(() => this.isSearchingVenta = false))
            .subscribe({
                next: (response) => {
                    if (response) {
                        this.venta = response;
                        this.cargarDetallesVenta();
                    } else {
                        alert('Venta no encontrada');
                    }
                },
                error: () => alert('Error al buscar la venta')
            });
    }

    cargarDetallesVenta(): void {
        if (!this.venta || !this.venta.detalles) return;

        this.venta.detalles.forEach(detalle => {
            // Solo agregar si hay cantidad disponible (opcional, si el backend controla devoluciones previas)
            this.detalles.push(this.crearDetalleForm(detalle));
        });
    }

    crearDetalleForm(detalle: DetalleVenta): FormGroup {
        return this.fb.group({
            seleccionado: [false],
            articulo_id: [detalle.articulo_id],
            articulo_nombre: [detalle.articulo?.nombre],
            almacen_id: [this.venta?.almacen_id || (this.almacenes.length > 0 ? this.almacenes[0].id : ''), [Validators.required]],
            cantidad_vendida: [detalle.cantidad],
            cantidad_devolver: [0, [Validators.required, Validators.min(0.01), Validators.max(detalle.cantidad)]],
            precio_unitario: [detalle.precio]
        });
    }

    onSubmit(): void {
        if (this.devolucionForm.invalid) {
            this.devolucionForm.markAllAsTouched();
            return;
        }

        const formValue = this.devolucionForm.value;

        // Filtrar solo los seleccionados y con cantidad > 0
        const detallesParaEnviar = formValue.detalles
            .filter((d: { seleccionado: boolean; cantidad_devolver: number }) => d.seleccionado && d.cantidad_devolver > 0)
            .map((d: { articulo_id: number; almacen_id: number; cantidad_devolver: number; precio_unitario: number }) => ({
                articulo_id: d.articulo_id,
                almacen_id: d.almacen_id,
                cantidad: d.cantidad_devolver,
                precio_unitario: d.precio_unitario
            }));

        if (detallesParaEnviar.length === 0) {
            alert('Debe seleccionar al menos un producto para devolver');
            return;
        }

        const payload = {
            venta_id: formValue.venta_id,
            fecha: formValue.fecha,
            motivo: formValue.motivo,
            observaciones: formValue.observaciones,
            detalles: detallesParaEnviar
        };

        this.isLoading = true;
        this.devolucionService.create(payload)
            .pipe(finalize(() => this.isLoading = false))
            .subscribe({
                next: () => {
                    alert('Devolución registrada exitosamente');
                    this.router.navigate(['/operaciones/devoluciones']);
                },
                error: (error) => {
                    console.error('Error creating devolucion', error);
                    alert('Error al registrar la devolución');
                }
            });
    }
}
