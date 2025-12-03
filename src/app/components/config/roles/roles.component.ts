import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RolService } from '../../../services/rol.service';
import { Rol } from '../../../interfaces';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.css'
})
export class RolesComponent implements OnInit {
  roles: Rol[] = [];
  form: FormGroup;
  isModalOpen = false;
  isEditing = false;
  isLoading = false;
  currentId: number | null = null;

  constructor(
    private rolService: RolService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: [''],
      estado: [true]
    });
  }

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.isLoading = true;
    this.rolService.getAll()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          this.roles = response.data;
        },
        error: (error) => console.error('Error loading roles', error)
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

  edit(rol: Rol): void {
    this.isModalOpen = true;
    this.isEditing = true;
    this.currentId = rol.id;
    this.form.patchValue({
      nombre: rol.nombre,
      descripcion: rol.descripcion,
      estado: rol.estado
    });
  }

  save(): void {
    if (this.form.invalid) return;

    const rolData = this.form.value;

    if (this.isEditing && this.currentId) {
      this.rolService.update(this.currentId, rolData).subscribe({
        next: () => {
          this.loadRoles();
          this.closeModal();
        },
        error: (error) => console.error('Error updating rol', error)
      });
    } else {
      this.rolService.create(rolData).subscribe({
        next: () => {
          this.loadRoles();
          this.closeModal();
        },
        error: (error) => console.error('Error creating rol', error)
      });
    }
  }

  delete(id: number): void {
    if (confirm('¿Está seguro de eliminar este rol?')) {
      this.rolService.delete(id).subscribe({
        next: () => this.loadRoles(),
        error: (error) => console.error('Error deleting rol', error)
      });
    }
  }
}
