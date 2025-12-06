import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Moneda } from '../../../../interfaces';

@Component({
  selector: 'app-tipo-cambio-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DecimalPipe],
  templateUrl: './tipo-cambio-form.component.html',
})
export class TipoCambioFormComponent implements OnInit {
  @Input() moneda: Moneda | null = null;

  @Output() save = new EventEmitter<number>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      nuevoTipoCambio: [0, [Validators.required, Validators.min(0.0001)]]
    });
  }

  ngOnInit(): void {
    if (this.moneda) {
      this.form.patchValue({
        nuevoTipoCambio: this.moneda.tipo_cambio
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const nuevoTipoCambio = this.form.get('nuevoTipoCambio')?.value;
    if (!nuevoTipoCambio || nuevoTipoCambio <= 0) {
      return;
    }

    this.save.emit(nuevoTipoCambio);
  }

  onCancel(): void {
    this.cancel.emit();
  }
}

