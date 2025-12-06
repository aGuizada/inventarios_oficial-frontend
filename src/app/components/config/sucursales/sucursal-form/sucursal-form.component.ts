import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Sucursal, Empresa } from '../../../../interfaces';

@Component({
  selector: 'app-sucursal-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './sucursal-form.component.html',
})
export class SucursalFormComponent implements OnInit, OnChanges {
  @Input() sucursal: Sucursal | null = null;
  @Input() empresas: Empresa[] = [];

  @Output() save = new EventEmitter<Sucursal>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;
  isEditing: boolean = false;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      empresa_id: ['', Validators.required],
      nombre: ['', Validators.required],
      codigoSucursal: [''],
      direccion: [''],
      correo: ['', [Validators.email]],
      telefono: [''],
      departamento: [''],
      responsable: [''],
      estado: [true]
    });
  }

  ngOnInit(): void {
    this.loadSucursalData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sucursal'] && !changes['sucursal'].firstChange) {
      this.loadSucursalData();
    }
  }

  loadSucursalData(): void {
    if (this.sucursal) {
      this.isEditing = true;
      this.form.patchValue({
        empresa_id: this.sucursal.empresa_id,
        nombre: this.sucursal.nombre,
        codigoSucursal: this.sucursal.codigoSucursal,
        direccion: this.sucursal.direccion,
        correo: this.sucursal.correo,
        telefono: this.sucursal.telefono,
        departamento: this.sucursal.departamento,
        responsable: this.sucursal.responsable,
        estado: this.sucursal.estado
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

    const sucursalData = { ...this.form.value };
    sucursalData.empresa_id = Number(sucursalData.empresa_id);
    this.save.emit(sucursalData);
  }

  onCancel(): void {
    this.cancel.emit();
  }
}

