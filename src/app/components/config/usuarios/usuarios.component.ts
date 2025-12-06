import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../services/user.service';
import { RolService } from '../../../services/rol.service';
import { SucursalService } from '../../../services/sucursal.service';
import { User, Rol, Sucursal } from '../../../interfaces';
import { finalize } from 'rxjs/operators';

// Import child components
import { UsuariosListComponent } from './usuarios-list/usuarios-list.component';
import { UsuarioFormComponent } from './usuario-form/usuario-form.component';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    UsuariosListComponent,
    UsuarioFormComponent
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
    this.userService.getAll()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          this.usuarios = response.data;
        },
        error: (error) => console.error('Error loading usuarios', error)
      });
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
}
