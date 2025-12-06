import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Proveedor } from '../../../../interfaces';

@Component({
  selector: 'app-proveedor-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './proveedor-form.component.html',
})
export class ProveedorFormComponent implements OnInit, OnChanges {
  @Input() proveedor: Proveedor | null = null;

  @Output() save = new EventEmitter<Proveedor>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;
  isEditing: boolean = false;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      tipo_documento: [''],
      num_documento: [''],
      direccion: [''],
      telefono: [''],
      email: ['', [Validators.email]],
      estado: [true]
    });
  }

  ngOnInit(): void {
    this.loadProveedorData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['proveedor'] && !changes['proveedor'].firstChange) {
      this.loadProveedorData();
    }
  }

  loadProveedorData(): void {
    if (this.proveedor) {
      this.isEditing = true;
      this.form.patchValue({
        nombre: this.proveedor.nombre,
        tipo_documento: this.proveedor.tipo_documento,
        num_documento: this.proveedor.num_documento,
        direccion: this.proveedor.direccion,
        telefono: this.proveedor.telefono,
        email: this.proveedor.email,
        estado: this.proveedor.estado
      });
    } else {
      this.isEditing = false;
      this.form.reset({ estado: true });
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
}

