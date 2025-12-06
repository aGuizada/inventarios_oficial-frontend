import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../../services/user.service';
import { RolService } from '../../../services/rol.service';
import { SucursalService } from '../../../services/sucursal.service';
import { User, Rol, Sucursal } from '../../../interfaces';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './usuarios.component.html',
})
export class UsuariosComponent implements OnInit {
  usuarios: User[] = [];
  roles: Rol[] = [];
  sucursales: Sucursal[] = [];
  form: FormGroup;
  isModalOpen = false;
  isEditing = false;
  isLoading = false;
  currentId: number | null = null;

  constructor(
    private userService: UserService,
    private rolService: RolService,
    private sucursalService: SucursalService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      usuario: ['', Validators.required],
      password: [''], // Optional for edit, required for create (handled in save)
      telefono: [''],
      rol_id: ['', Validators.required],
      sucursal_id: ['', Validators.required],
      estado: [true]
    });
  }

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

  openModal(): void {
    this.isModalOpen = true;
    this.isEditing = false;
    this.currentId = null;
    this.form.reset({ estado: true });
    this.form.get('password')?.setValidators([Validators.required]);
    this.form.get('password')?.updateValueAndValidity();
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.form.reset();
  }

  edit(user: User): void {
    this.isModalOpen = true;
    this.isEditing = true;
    this.currentId = user.id;
    this.form.patchValue({
      name: user.name,
      email: user.email,
      usuario: user.usuario,
      telefono: user.telefono,
      rol_id: user.rol_id,
      sucursal_id: user.sucursal_id,
      estado: user.estado
    });
    this.form.get('password')?.clearValidators();
    this.form.get('password')?.updateValueAndValidity();
  }

  save(): void {
    if (this.form.invalid) return;

    const userData = this.form.value;
    if (!userData.password) {
      delete userData.password;
    }

    if (this.isEditing && this.currentId) {
      this.userService.update(this.currentId, userData).subscribe({
        next: () => {
          this.loadUsuarios();
          this.closeModal();
        },
        error: (error) => console.error('Error updating user', error)
      });
    } else {
      this.userService.create(userData).subscribe({
        next: () => {
          this.loadUsuarios();
          this.closeModal();
        },
        error: (error) => console.error('Error creating user', error)
      });
    }
  }

  delete(id: number): void {
    if (confirm('¿Está seguro de eliminar este usuario?')) {
      this.userService.delete(id).subscribe({
        next: () => this.loadUsuarios(),
        error: (error) => console.error('Error deleting user', error)
      });
    }
  }
}
