import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormArray, ReactiveFormsModule } from '@angular/forms';
import { ClienteSelectorComponent } from '../cliente-selector/cliente-selector.component';
import { Cliente, TipoVenta, TipoPago } from '../../../../../../interfaces';
import { ProductoInventario } from '../../../../../../services/venta.service';

@Component({
    selector: 'app-shopping-cart',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, ClienteSelectorComponent],
    templateUrl: './shopping-cart.component.html',
})
export class ShoppingCartComponent implements OnChanges {
    @Input() parentForm!: FormGroup;
    @Input() clientes: Cliente[] = [];
    @Input() isLoading: boolean = false;
    @Input() productosInventario: ProductoInventario[] = [];
    @Input() tiposVenta: TipoVenta[] = [];
    @Input() tiposPago: TipoPago[] = [];
    @Output() remove = new EventEmitter<number>();

    constructor() { }

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
}
