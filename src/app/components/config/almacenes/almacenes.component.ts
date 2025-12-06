import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AlmacenService } from '../../../services/almacen.service';
import { SucursalService } from '../../../services/sucursal.service';
import { Almacen, Sucursal } from '../../../interfaces';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-almacenes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './almacenes.component.html',
})
export class AlmacenesComponent implements OnInit {
  almacenes: Almacen[] = [];
  sucursales: Sucursal[] = [];
  form: FormGroup;
  isModalOpen = false;
  isEditing = false;
  isLoading = false;
  currentId: number | null = null;

  constructor(
    private almacenService: AlmacenService,
    private sucursalService: SucursalService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      nombre_almacen: ['', Validators.required],
      ubicacion: ['', Validators.required],
      sucursal_id: ['', Validators.required],
      telefono: [''],
      estado: [true]
    });
  }

  ngOnInit(): void {
    this.loadAlmacenes();
    this.loadSucursales();
  }

  loadAlmacenes(): void {
    this.isLoading = true;
    this.almacenService.getAll()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          this.almacenes = response.data;
        },
        error: (error) => console.error('Error loading almacenes', error)
      });
  }

  loadSucursales(): void {
    this.sucursalService.getAll().subscribe({
      next: (response) => {
        this.sucursales = response.data;
      },
      error: (error) => console.error('Error loading sucursales', error)
    });
  }

  openModal(): void {
    this.isModalOpen = true;
    this.isEditing = false;
    this.currentId = null;
    this.form.reset({ estado: true });
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.form.reset();
  }

  edit(almacen: Almacen): void {
    this.isModalOpen = true;
    this.isEditing = true;
    this.currentId = almacen.id;
    this.form.patchValue({
      nombre_almacen: almacen.nombre_almacen,
      ubicacion: almacen.ubicacion,
      sucursal_id: almacen.sucursal_id,
      telefono: almacen.telefono,
      estado: almacen.estado
    });
  }

  save(): void {
    if (this.form.invalid) return;

    const almacenData = this.form.value;
    // Convert sucursal_id to number if it's a string
    almacenData.sucursal_id = Number(almacenData.sucursal_id);

    if (this.isEditing && this.currentId) {
      this.almacenService.update(this.currentId, almacenData).subscribe({
        next: () => {
          this.loadAlmacenes();
          this.closeModal();
        },
        error: (error) => console.error('Error updating almacen', error)
      });
    } else {
      this.almacenService.create(almacenData).subscribe({
        next: () => {
          this.loadAlmacenes();
          this.closeModal();
        },
        error: (error) => console.error('Error creating almacen', error)
      });
    }
  }

  delete(id: number): void {
    if (confirm('¿Está seguro de eliminar este almacén?')) {
      this.almacenService.delete(id).subscribe({
        next: () => this.loadAlmacenes(),
        error: (error) => console.error('Error deleting almacen', error)
      });
    }
  }
}
