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
      saldo_inicial: [0, [Validators.required, Validators.min(0)]],
      fecha_apertura: [new Date().toISOString().substring(0, 16), Validators.required]
    });
  }

  ngOnInit(): void {
    // Reset form on init
    this.form.reset({
      saldo_inicial: 0,
      fecha_apertura: new Date().toISOString().substring(0, 16)
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.save.emit(this.form.value);
  }

  onCancel(): void {
    this.cancel.emit();
  }
}

