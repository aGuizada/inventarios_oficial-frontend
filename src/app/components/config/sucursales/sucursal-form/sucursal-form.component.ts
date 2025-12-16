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
    if (changes['sucursal']) {
      // Cargar datos tanto en el primer cambio como en cambios posteriores
      this.loadSucursalData();
    }
  }

  loadSucursalData(): void {
    console.log('loadSucursalData llamado, sucursal:', this.sucursal);
    if (this.sucursal) {
      this.isEditing = true;
      console.log('Editando sucursal:', this.sucursal);
      // Asegurar que los valores se conviertan correctamente
      const empresaId = this.sucursal.empresa_id 
        ? (typeof this.sucursal.empresa_id === 'string' ? parseInt(this.sucursal.empresa_id, 10) : this.sucursal.empresa_id)
        : '';
      
      // Manejar el estado: puede ser booleano, número o string
      let estado = true;
      if (this.sucursal.estado !== undefined && this.sucursal.estado !== null) {
        if (typeof this.sucursal.estado === 'boolean') {
          estado = this.sucursal.estado;
        } else if (typeof this.sucursal.estado === 'number') {
          estado = this.sucursal.estado === 1;
        } else if (typeof this.sucursal.estado === 'string') {
          const estadoStr: string = this.sucursal.estado;
          estado = estadoStr === '1' || estadoStr.toLowerCase() === 'true' || estadoStr.toLowerCase() === 'activo';
        }
      }
      
      const formData = {
        empresa_id: empresaId,
        nombre: this.sucursal.nombre || '',
        codigoSucursal: this.sucursal.codigoSucursal || '',
        direccion: this.sucursal.direccion || '',
        correo: this.sucursal.correo || '',
        telefono: this.sucursal.telefono || '',
        departamento: this.sucursal.departamento || '',
        responsable: this.sucursal.responsable || '',
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

    const sucursalData = { ...this.form.value };
    sucursalData.empresa_id = Number(sucursalData.empresa_id);
    console.log('Datos a guardar:', sucursalData);
    console.log('Es edición:', this.isEditing);
    this.save.emit(sucursalData);
  }

  onCancel(): void {
    this.cancel.emit();
  }
}

