import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RolService } from '../../../services/rol.service';
import { Rol, PaginationParams } from '../../../interfaces';
import { finalize } from 'rxjs/operators';

// Import child components
import { RolesListComponent } from './roles-list/roles-list.component';
import { RolFormComponent } from './rol-form/rol-form.component';
import { SearchBarComponent } from '../../../shared/components/search-bar/search-bar.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [
    CommonModule,
    RolesListComponent,
    RolFormComponent,
    SearchBarComponent,
    PaginationComponent
  ],
  templateUrl: './roles.component.html',
})
export class RolesComponent implements OnInit {
  roles: Rol[] = [];
  isLoading = false;
  isFormModalOpen = false;
  selectedRol: Rol | null = null;
  
  // Paginación
  currentPage: number = 1;
  lastPage: number = 1;
  total: number = 0;
  perPage: number = 15;
  searchTerm: string = '';

  constructor(
    private rolService: RolService
  ) { }

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.isLoading = true;
    
    const params: PaginationParams = {
      page: this.currentPage,
      per_page: this.perPage,
      sort_by: 'id',
      sort_order: 'desc'
    };
    
    if (this.searchTerm) {
      params.search = this.searchTerm;
    }
    
    this.rolService.getPaginated(params)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          if (response.data) {
            this.roles = response.data.data || [];
            this.currentPage = response.data.current_page;
            this.lastPage = response.data.last_page;
            this.total = response.data.total;
            this.perPage = response.data.per_page;
          }
        },
        error: (error) => {
          console.error('Error loading roles', error);
          // Fallback a getAll si falla la paginación
          this.rolService.getAll()
            .pipe(finalize(() => this.isLoading = false))
            .subscribe({
              next: (response) => {
                this.roles = response.data || [];
              }
            });
        }
      });
  }

  onSearch(search: string): void {
    this.searchTerm = search;
    this.currentPage = 1;
    this.loadRoles();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadRoles();
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
