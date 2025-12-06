import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Caja } from '../../../../interfaces';

@Component({
  selector: 'app-arqueo-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CurrencyPipe],
  templateUrl: './arqueo-form.component.html',
})
export class ArqueoFormComponent implements OnInit {
  @Input() cajas: Caja[] = [];

  @Output() save = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;
  totalCalculado = 0;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      caja_id: ['', Validators.required],
      billete200: [0, [Validators.required, Validators.min(0)]],
      billete100: [0, [Validators.required, Validators.min(0)]],
      billete50: [0, [Validators.required, Validators.min(0)]],
      billete20: [0, [Validators.required, Validators.min(0)]],
      billete10: [0, [Validators.required, Validators.min(0)]],
      moneda5: [0, [Validators.required, Validators.min(0)]],
      moneda2: [0, [Validators.required, Validators.min(0)]],
      moneda1: [0, [Validators.required, Validators.min(0)]],
      moneda050: [0, [Validators.required, Validators.min(0)]],
      moneda020: [0, [Validators.required, Validators.min(0)]],
      moneda010: [0, [Validators.required, Validators.min(0)]],
    });

    this.form.valueChanges.subscribe(() => {
      this.calculateTotal();
    });
  }

  ngOnInit(): void {
    this.form.reset({
      billete200: 0, billete100: 0, billete50: 0, billete20: 0, billete10: 0,
      moneda5: 0, moneda2: 0, moneda1: 0, moneda050: 0, moneda020: 0, moneda010: 0
    });
    this.totalCalculado = 0;
  }

  calculateTotal(): void {
    const v = this.form.value;
    this.totalCalculado =
      (v.billete200 || 0) * 200 +
      (v.billete100 || 0) * 100 +
      (v.billete50 || 0) * 50 +
      (v.billete20 || 0) * 20 +
      (v.billete10 || 0) * 10 +
      (v.moneda5 || 0) * 5 +
      (v.moneda2 || 0) * 2 +
      (v.moneda1 || 0) * 1 +
      (v.moneda050 || 0) * 0.50 +
      (v.moneda020 || 0) * 0.20 +
      (v.moneda010 || 0) * 0.10;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const arqueoData = {
      ...this.form.value,
      total_efectivo: this.totalCalculado
    };

    this.save.emit(arqueoData);
  }

  onCancel(): void {
    this.cancel.emit();
  }
}

