import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
    selector: 'app-credito-modal',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './credito-modal.component.html',
})
export class CreditoModalComponent {
    @Input() parentForm!: FormGroup;
    @Input() isOpen: boolean = false;
    @Output() close = new EventEmitter<void>();

    cerrarModal(): void {
        this.close.emit();
    }

    guardarDatosCredito(): void {
        // Los datos ya están en el formulario reactivo
        this.close.emit();
    }
}
