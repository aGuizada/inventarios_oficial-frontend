import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { User, Rol, Sucursal } from '../../../../interfaces';

@Component({
  selector: 'app-usuario-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './usuario-form.component.html',
})
export class UsuarioFormComponent implements OnInit, OnChanges {
  @Input() user: User | null = null;
  @Input() roles: Rol[] = [];
  @Input() sucursales: Sucursal[] = [];

  @Output() save = new EventEmitter<User>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;
  isEditing: boolean = false;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      usuario: ['', Validators.required],
      password: ['', Validators.required],
      telefono: [''],
      rol_id: ['', Validators.required],
      sucursal_id: ['', Validators.required],
      estado: [true]
    });
  }

  ngOnInit(): void {
    this.loadUserData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user'] && !changes['user'].firstChange) {
      this.loadUserData();
    }
  }

  loadUserData(): void {
    if (this.user) {
      this.isEditing = true;
      this.form.patchValue({
        name: this.user.name,
        email: this.user.email,
        usuario: this.user.usuario,
        telefono: this.user.telefono,
        rol_id: this.user.rol_id,
        sucursal_id: this.user.sucursal_id,
        estado: this.user.estado
      });
      // Password is optional when editing
      this.form.get('password')?.clearValidators();
      this.form.get('password')?.updateValueAndValidity();
    } else {
      this.isEditing = false;
      this.form.reset({ estado: true });
      // Password is required when creating
      this.form.get('password')?.setValidators([Validators.required]);
      this.form.get('password')?.updateValueAndValidity();
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const userData = { ...this.form.value };
    // Remove password if empty (when editing)
    if (!userData.password) {
      delete userData.password;
    }
    userData.rol_id = Number(userData.rol_id);
    userData.sucursal_id = Number(userData.sucursal_id);
    this.save.emit(userData);
  }

  onCancel(): void {
    this.cancel.emit();
  }
}

