import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Cliente } from '../../../../interfaces';

@Component({
  selector: 'app-cliente-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cliente-form.component.html',
})
export class ClienteFormComponent implements OnInit, OnChanges {
  @Input() cliente: Cliente | null = null;

  @Output() save = new EventEmitter<Cliente>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;
  isEditing: boolean = false;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      tipo_documento: [''],
      num_documento: [''],
      telefono: [''],
      email: ['', [Validators.email]],
      direccion: [''],
      estado: [true]
    });
  }

  ngOnInit(): void {
    this.loadClienteData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cliente'] && !changes['cliente'].firstChange) {
      this.loadClienteData();
    }
  }

  loadClienteData(): void {
    if (this.cliente) {
      this.isEditing = true;
      this.form.patchValue({
        nombre: this.cliente.nombre,
        tipo_documento: this.cliente.tipo_documento,
        num_documento: this.cliente.num_documento,
        telefono: this.cliente.telefono,
        email: this.cliente.email,
        direccion: this.cliente.direccion,
        estado: this.cliente.estado
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

