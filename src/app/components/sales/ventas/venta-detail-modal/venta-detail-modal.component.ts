import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { Venta } from '../../../../interfaces';

@Component({
    selector: 'app-venta-detail-modal',
    standalone: true,
    imports: [CommonModule, DatePipe, CurrencyPipe],
    templateUrl: './venta-detail-modal.component.html'
})
export class VentaDetailModalComponent {
    @Input() venta: Venta | null = null;
    @Input() isOpen: boolean = false;
    @Output() close = new EventEmitter<void>();
    @Output() print = new EventEmitter<Venta>();

    onClose(): void {
        this.close.emit();
    }

    onPrint(): void {
        if (this.venta) {
            this.print.emit(this.venta);
        }
    }
}
