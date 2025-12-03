import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProveedorService } from '../../../services/proveedor.service';
import { Proveedor } from '../../../interfaces';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './proveedores.component.html',
  styleUrl: './proveedores.component.css'
})
export class ProveedoresComponent implements OnInit {
  proveedores: Proveedor[] = [];
  form: FormGroup;
  isModalOpen = false;
  isEditing = false;
  isLoading = false;
  currentId: number | null = null;

  constructor(
    private proveedorService: ProveedorService,
    private fb: FormBuilder
  ) {
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
    this.loadProveedores();
  }

  loadProveedores(): void {
    this.isLoading = true;
    this.proveedorService.getAll()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          this.proveedores = response.data;
        },
        error: (error) => console.error('Error loading proveedores', error)
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

  edit(proveedor: Proveedor): void {
    this.isModalOpen = true;
    this.isEditing = true;
    this.currentId = proveedor.id;
    this.form.patchValue({
      nombre: proveedor.nombre,
      tipo_documento: proveedor.tipo_documento,
      num_documento: proveedor.num_documento,
      direccion: proveedor.direccion,
      telefono: proveedor.telefono,
      email: proveedor.email,
      estado: proveedor.estado
    });
  }

  save(): void {
    if (this.form.invalid) return;

    const proveedorData = this.form.value;

    if (this.isEditing && this.currentId) {
      this.proveedorService.update(this.currentId, proveedorData).subscribe({
        next: () => {
          this.loadProveedores();
          this.closeModal();
        },
        error: (error) => console.error('Error updating proveedor', error)
      });
    } else {
      this.proveedorService.create(proveedorData).subscribe({
        next: () => {
          this.loadProveedores();
          this.closeModal();
        },
        error: (error) => console.error('Error creating proveedor', error)
      });
    }
  }

  delete(id: number): void {
    if (confirm('¿Está seguro de eliminar este proveedor?')) {
      this.proveedorService.delete(id).subscribe({
        next: () => this.loadProveedores(),
        error: (error) => console.error('Error deleting proveedor', error)
      });
    }
  }
}
