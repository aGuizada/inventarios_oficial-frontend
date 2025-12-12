import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../services/user.service';
import { RolService } from '../../../services/rol.service';
import { SucursalService } from '../../../services/sucursal.service';
import { User, Rol, Sucursal, PaginationParams } from '../../../interfaces';
import { finalize } from 'rxjs/operators';

// Import child components
import { UsuariosListComponent } from './usuarios-list/usuarios-list.component';
import { UsuarioFormComponent } from './usuario-form/usuario-form.component';
import { SearchBarComponent } from '../../../shared/components/search-bar/search-bar.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    UsuariosListComponent,
    UsuarioFormComponent,
    SearchBarComponent,
    PaginationComponent
  ],
  templateUrl: './usuarios.component.html',
})
export class UsuariosComponent implements OnInit {
  usuarios: User[] = [];
  roles: Rol[] = [];
  sucursales: Sucursal[] = [];
  isLoading = false;
  isFormModalOpen = false;
  selectedUser: User | null = null;

  // Paginación
  currentPage: number = 1;
  lastPage: number = 1;
  total: number = 0;
  perPage: number = 15;
  searchTerm: string = '';

  constructor(
    private userService: UserService,
    private rolService: RolService,
    private sucursalService: SucursalService
  ) { }

  ngOnInit(): void {
    this.loadUsuarios();
    this.loadDependencies();
  }

  loadDependencies(): void {
    this.rolService.getAll().subscribe(res => this.roles = res.data);
    this.sucursalService.getAll().subscribe(res => this.sucursales = res.data);
  }

  loadUsuarios(): void {
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

    this.userService.getPaginated(params)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          if (response.data) {
            this.usuarios = response.data.data || [];
            this.currentPage = response.data.current_page;
            this.lastPage = response.data.last_page;
            this.total = response.data.total;
            this.perPage = response.data.per_page;
          }
        },
        error: (error) => {
          console.error('Error loading usuarios', error);
          // Fallback a getAll si falla la paginación
          this.userService.getAll()
            .pipe(finalize(() => this.isLoading = false))
            .subscribe({
              next: (response) => {
                this.usuarios = response.data || [];
              }
            });
        }
      });
  }

  onSearch(search: string): void {
    this.searchTerm = search;
    this.currentPage = 1;
    this.loadUsuarios();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadUsuarios();
  }

  openFormModal(): void {
    this.selectedUser = null;
    this.isFormModalOpen = true;
  }

  closeFormModal(): void {
    this.isFormModalOpen = false;
    this.selectedUser = null;
  }

  onEdit(user: User): void {
    this.selectedUser = user;
    this.isFormModalOpen = true;
  }

  onDelete(id: number): void {
    if (confirm('¿Está seguro de eliminar este usuario?')) {
      this.userService.delete(id).subscribe({
        next: () => this.loadUsuarios(),
        error: (error) => console.error('Error deleting user', error)
      });
    }
  }

  onSave(userData: User): void {
    this.isLoading = true;
    const request = this.selectedUser && this.selectedUser.id
      ? this.userService.update(this.selectedUser.id, userData)
      : this.userService.create(userData);

    request
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          this.loadUsuarios();
          this.closeFormModal();
        },
        error: (error) => console.error('Error saving user', error)
      });
  }
  exportExcel(): void {
    this.userService.exportExcel();
  }

  exportPDF(): void {
    this.userService.exportPDF();
  }
}
