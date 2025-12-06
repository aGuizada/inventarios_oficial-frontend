import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RolService } from '../../../services/rol.service';
import { Rol } from '../../../interfaces';
import { finalize } from 'rxjs/operators';

// Import child components
import { RolesListComponent } from './roles-list/roles-list.component';
import { RolFormComponent } from './rol-form/rol-form.component';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [
    CommonModule,
    RolesListComponent,
    RolFormComponent
  ],
  templateUrl: './roles.component.html',
})
export class RolesComponent implements OnInit {
  roles: Rol[] = [];
  isLoading = false;
  isFormModalOpen = false;
  selectedRol: Rol | null = null;

  constructor(
    private rolService: RolService
  ) { }

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

  openFormModal(): void {
    this.selectedRol = null;
    this.isFormModalOpen = true;
  }

  closeFormModal(): void {
    this.isFormModalOpen = false;
    this.selectedRol = null;
  }

  onEdit(rol: Rol): void {
    this.selectedRol = rol;
    this.isFormModalOpen = true;
  }

  onDelete(id: number): void {
    if (confirm('¿Está seguro de eliminar este rol?')) {
      this.rolService.delete(id).subscribe({
        next: () => this.loadRoles(),
        error: (error) => console.error('Error deleting rol', error)
      });
    }
  }

  onSave(rolData: Rol): void {
    this.isLoading = true;
    const request = this.selectedRol && this.selectedRol.id
      ? this.rolService.update(this.selectedRol.id, rolData)
      : this.rolService.create(rolData);

    request
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          this.loadRoles();
          this.closeFormModal();
        },
        error: (error) => console.error('Error saving rol', error)
      });
  }
}
