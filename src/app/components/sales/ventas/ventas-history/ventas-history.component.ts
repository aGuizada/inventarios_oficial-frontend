import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Venta } from '../../../../interfaces';

@Component({
    selector: 'app-ventas-history',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './ventas-history.component.html',
})
export class VentasHistoryComponent {
    @Input() ventas: Venta[] = [];
    @Input() isLoading: boolean = false;
    @Output() nuevaVenta = new EventEmitter<void>();
    @Output() verDetalle = new EventEmitter<Venta>();
    @Output() devolverVenta = new EventEmitter<Venta>();
    @Output() anularVenta = new EventEmitter<Venta>();

    onNuevaVenta(): void {
        this.nuevaVenta.emit();
    }

    onVerDetalle(venta: Venta): void {
        this.verDetalle.emit(venta);
    }

    onDevolverVenta(venta: Venta): void {
        this.devolverVenta.emit(venta);
    }

    onAnularVenta(venta: Venta): void {
        this.anularVenta.emit(venta);
    }
}
