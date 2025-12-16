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
    if (changes['almacen']) {
      // Cargar datos tanto en el primer cambio como en cambios posteriores
      this.loadAlmacenData();
    }
  }

  loadAlmacenData(): void {
    console.log('loadAlmacenData llamado, almacen:', this.almacen);
    if (this.almacen) {
      this.isEditing = true;
      console.log('Editando almacén:', this.almacen);
      // Asegurar que los valores se conviertan correctamente
      const sucursalId = this.almacen.sucursal_id 
        ? (typeof this.almacen.sucursal_id === 'string' ? parseInt(this.almacen.sucursal_id, 10) : this.almacen.sucursal_id)
        : '';
      
      // Manejar el estado: puede ser booleano, número o string
      let estado = true;
      if (this.almacen.estado !== undefined && this.almacen.estado !== null) {
        if (typeof this.almacen.estado === 'boolean') {
          estado = this.almacen.estado;
        } else if (typeof this.almacen.estado === 'number') {
          estado = this.almacen.estado === 1;
        } else if (typeof this.almacen.estado === 'string') {
          const estadoStr: string = this.almacen.estado;
          estado = estadoStr === '1' || estadoStr.toLowerCase() === 'true' || estadoStr.toLowerCase() === 'activo';
        }
      }
      
      const formData = {
        nombre_almacen: this.almacen.nombre_almacen || '',
        ubicacion: this.almacen.ubicacion || '',
        sucursal_id: sucursalId,
        telefono: this.almacen.telefono || '',
        estado: estado
      };
      
      console.log('Datos del formulario a cargar:', formData);
      this.form.patchValue(formData);
      console.log('Formulario después de patchValue:', this.form.value);
    } else {
      this.isEditing = false;
      this.form.reset({ estado: true });
    }
  }

  onSubmit(): void {
    console.log('onSubmit llamado, formulario válido:', this.form.valid);
    console.log('Valores del formulario:', this.form.value);
    
    if (this.form.invalid) {
      console.error('Formulario inválido:', this.form.errors);
      this.form.markAllAsTouched();
      return;
    }

    const almacenData = { ...this.form.value };
    almacenData.sucursal_id = Number(almacenData.sucursal_id);
    console.log('Datos a guardar:', almacenData);
    console.log('Es edición:', this.isEditing);
    this.save.emit(almacenData);
  }

  onCancel(): void {
    this.cancel.emit();
  }
}

