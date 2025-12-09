import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Sucursal } from '../../../../interfaces';

@Component({
  selector: 'app-caja-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './caja-form.component.html',
})
export class CajaFormComponent implements OnInit {
  @Input() sucursales: Sucursal[] = [];

  @Output() save = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      sucursal_id: ['', Validators.required],
      saldo_inicial: [0, [Validators.required, Validators.min(0)]]
      // fecha_apertura se establecerá automáticamente al enviar
    });
  }

  ngOnInit(): void {
    // Reset form on init
    this.form.reset({
      saldo_inicial: 0
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Establecer fecha y hora de apertura automáticamente en formato MySQL/Laravel
    const now = new Date();
    const fechaApertura = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const formData = {
      ...this.form.value,
      fecha_apertura: fechaApertura
    };

    this.save.emit(formData);
  }

  onCancel(): void {
    this.cancel.emit();
  }
}

