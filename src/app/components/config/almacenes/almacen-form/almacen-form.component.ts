import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Almacen, Sucursal } from '../../../../interfaces';

@Component({
  selector: 'app-almacen-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './almacen-form.component.html',
})
export class AlmacenFormComponent implements OnInit, OnChanges {
  @Input() almacen: Almacen | null = null;
  @Input() sucursales: Sucursal[] = [];

  @Output() save = new EventEmitter<Almacen>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;
  isEditing: boolean = false;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      nombre_almacen: ['', Validators.required],
      ubicacion: ['', Validators.required],
      sucursal_id: ['', Validators.required],
      telefono: [''],
      estado: [true]
    });
  }

  ngOnInit(): void {
    this.loadAlmacenData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['almacen'] && !changes['almacen'].firstChange) {
      this.loadAlmacenData();
    }
  }

  loadAlmacenData(): void {
    if (this.almacen) {
      this.isEditing = true;
      this.form.patchValue({
        nombre_almacen: this.almacen.nombre_almacen,
        ubicacion: this.almacen.ubicacion,
        sucursal_id: this.almacen.sucursal_id,
        telefono: this.almacen.telefono,
        estado: this.almacen.estado
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

    const almacenData = { ...this.form.value };
    almacenData.sucursal_id = Number(almacenData.sucursal_id);
    this.save.emit(almacenData);
  }

  onCancel(): void {
    this.cancel.emit();
  }
}

