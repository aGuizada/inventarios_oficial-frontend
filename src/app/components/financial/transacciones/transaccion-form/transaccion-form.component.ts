import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Caja } from '../../../../interfaces';

@Component({
  selector: 'app-transaccion-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './transaccion-form.component.html',
})
export class TransaccionFormComponent implements OnInit {
  @Input() cajas: Caja[] = [];

  @Output() save = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      caja_id: ['', Validators.required],
      transaccion: ['ingreso', Validators.required],
      importe: ['', [Validators.required, Validators.min(0.01)]],
      descripcion: ['', Validators.required],
      referencia: [''],
      fecha: [new Date().toISOString().substring(0, 10), Validators.required]
    });
  }

  ngOnInit(): void {
    this.form.reset({
      transaccion: 'ingreso',
      fecha: new Date().toISOString().substring(0, 10)
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

