import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MonedaPipe } from '../../../../../../pipes/moneda.pipe';
import { FormGroup, FormArray, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ClienteSelectorComponent } from '../cliente-selector/cliente-selector.component';
import { Cliente, TipoVenta, TipoPago, Medida } from '../../../../../../interfaces';
import { ProductoInventario } from '../../../../../../services/venta.service';
import { MedidaService } from '../../../../../../services/medida.service';

@Component({
    selector: 'app-shopping-cart',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, MonedaPipe, ClienteSelectorComponent],
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
    openPriceSelectorIndex: number | null = null;

    constructor(private medidaService: MedidaService, private fb: FormBuilder) { }

    ngOnInit(): void {
        this.loadMedidas();
    }

    loadMedidas(): void {
        // El backend solo acepta estos valores: 'Unidad', 'Paquete', 'Centimetro'
        // Usar estos valores fijos en lugar de cargar desde la base de datos
        this.unidadesMedida = ['Unidad', 'Paquete', 'Centimetro'];
    }

    ngOnChanges(changes: SimpleChanges): void {
        // Cambios detectados, no se requiere logging
    }

    get detalles() {
        return this.parentForm.get('detalles') as FormArray;
    }

    get pagos() {
        return this.parentForm.get('pagos') as FormArray;
    }

    trackByIndex(index: number): number {
        return index;
    }

    removeDetalle(index: number, event?: Event): void {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
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

    seleccionarTipoVenta(tipoVentaId: number, event?: Event): void {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        this.parentForm.patchValue({ tipo_venta_id: tipoVentaId });
        this.parentForm.get('tipo_venta_id')?.updateValueAndValidity();
    }

    agregarPago(tipoPagoId: number, event?: Event): void {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        const totalVenta = this.parentForm.get('total')?.value || 0;
        const totalPagado = this.calcularTotalPagado();
        const restante = totalVenta - totalPagado;

        if (restante <= 0) {
            alert('El total de la venta ya ha sido cubierto.');
            return;
        }

        const pagoGroup = this.fb.group({
            tipo_pago_id: [tipoPagoId, Validators.required],
            monto: [parseFloat(restante.toFixed(2)), [Validators.required, Validators.min(0)]],
            referencia: ['']
        });

        this.pagos.push(pagoGroup);

        // Si es el primer pago, también actualizamos el tipo_pago_id principal por compatibilidad
        if (this.pagos.length === 1) {
            this.parentForm.patchValue({ tipo_pago_id: tipoPagoId });
        }
    }

    removerPago(index: number, event?: Event): void {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        this.pagos.removeAt(index);
        // Si borramos todos, limpiamos el principal
        if (this.pagos.length === 0) {
            this.parentForm.patchValue({ tipo_pago_id: '' });
        }
    }

    calcularTotalPagado(): number {
        return this.pagos.controls.reduce((acc, control) => {
            return acc + (parseFloat(control.get('monto')?.value) || 0);
        }, 0);
    }

    get montoRestante(): number {
        const totalVenta = this.parentForm.get('total')?.value || 0;
        const totalPagado = this.calcularTotalPagado();
        return Math.max(0, totalVenta - totalPagado);
    }

    isPagoAdded(tipoPagoId: number): boolean {
        return this.pagos.controls.some(p => p.get('tipo_pago_id')?.value === tipoPagoId);
    }

    getNombreTipoPago(id: number): string {
        const tipo = this.tiposPago.find(t => t.id === id);
        return tipo ? (tipo.nombre_tipo_pago || tipo.nombre || 'Desconocido') : 'Desconocido';
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

    getPreciosDisponibles(index: number): { label: string, value: number }[] {
        const detalle = this.detalles.at(index);
        const articuloId = detalle.get('articulo_id')?.value;
        const producto = this.productosInventario.find(p => p.articulo_id === articuloId);

        if (!producto || !producto.articulo) return [];

        const precios = [
            { label: 'Normal', value: Number(producto.articulo.precio_venta) },
            { label: 'Precio 1', value: Number(producto.articulo.precio_uno) },
            { label: 'Precio 2', value: Number(producto.articulo.precio_dos) },
            { label: 'Precio 3', value: Number(producto.articulo.precio_tres) },
            { label: 'Precio 4', value: Number(producto.articulo.precio_cuatro) }
        ];

        return precios.filter(p => p.value > 0);
    }

    dropdownPosition = { top: 0, left: 0 };

    togglePriceSelector(index: number, event?: MouseEvent): void {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        if (this.openPriceSelectorIndex === index) {
            this.openPriceSelectorIndex = null;
        } else {
            this.openPriceSelectorIndex = index;
            if (event && event.target) {
                const button = (event.target as HTMLElement).closest('button');
                if (button) {
                    const rect = button.getBoundingClientRect();
                    this.dropdownPosition = {
                        top: rect.bottom + window.scrollY + 5,
                        left: rect.right - 192 // 192px is w-48 (12rem)
                    };
                }
            }
        }
    }

    closePriceSelector(): void {
        this.openPriceSelectorIndex = null;
    }

    seleccionarPrecio(index: number, precio: number, event?: Event): void {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        const detalle = this.detalles.at(index);
        detalle.patchValue({ precio: precio });
        this.closePriceSelector();
    }

    getProducto(articuloId: number): ProductoInventario | undefined {
        return this.productosInventario.find(p => p.articulo_id === articuloId);
    }
}
