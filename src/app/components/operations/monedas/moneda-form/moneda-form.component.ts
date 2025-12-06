import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Moneda, Empresa } from '../../../../interfaces';

@Component({
  selector: 'app-moneda-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './moneda-form.component.html',
})
export class MonedaFormComponent implements OnInit, OnChanges {
  @Input() moneda: Moneda | null = null;
  @Input() empresas: Empresa[] = [];

  @Output() save = new EventEmitter<Moneda>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;
  isEditing: boolean = false;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      empresa_id: ['', [Validators.required]],
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      pais: ['', [Validators.maxLength(50)]],
      simbolo: ['', [Validators.maxLength(10)]],
      tipo_cambio: [1, [Validators.required, Validators.min(0.0001)]],
      estado: [true]
    });
  }

  ngOnInit(): void {
    this.loadMonedaData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['moneda'] && !changes['moneda'].firstChange) {
      this.loadMonedaData();
    }
  }

  loadMonedaData(): void {
    if (this.moneda) {
      this.isEditing = true;
      this.form.patchValue({
        empresa_id: this.moneda.empresa_id,
        nombre: this.moneda.nombre,
        pais: this.moneda.pais || '',
        simbolo: this.moneda.simbolo,
        tipo_cambio: this.moneda.tipo_cambio,
        estado: this.moneda.estado !== undefined ? this.moneda.estado : true
      });
    } else {
      this.isEditing = false;
      this.form.reset({
        empresa_id: '',
        nombre: '',
        pais: '',
        simbolo: '',
        tipo_cambio: 1,
        estado: true
      });
    }
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

  getFieldError(fieldName: string): string {
    const field = this.form.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} es requerido`;
      }
      if (field.errors['minlength']) {
        return `${this.getFieldLabel(fieldName)} debe tener al menos ${field.errors['minlength'].requiredLength} caracteres`;
      }
      if (field.errors['maxlength']) {
        return `${this.getFieldLabel(fieldName)} debe tener máximo ${field.errors['maxlength'].requiredLength} caracteres`;
      }
      if (field.errors['min']) {
        return `${this.getFieldLabel(fieldName)} debe ser mayor a ${field.errors['min'].min}`;
      }
    }
    return '';
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      empresa_id: 'Empresa',
      nombre: 'Nombre',
      pais: 'País',
      simbolo: 'Símbolo',
      tipo_cambio: 'Tipo de cambio',
      estado: 'Estado'
    };
    return labels[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field?.invalid && field.touched);
  }
}
