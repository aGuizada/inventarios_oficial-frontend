import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Sucursal } from '../../../../interfaces';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-caja-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './caja-form.component.html',
})
export class CajaFormComponent implements OnInit {
  @Input() sucursales: Sucursal[] = [];

  @Output() save = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;
  isVendedor: boolean = false;
  currentUserSucursalId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.form = this.fb.group({
      sucursal_id: ['', Validators.required],
      saldo_inicial: [0, [Validators.required, Validators.min(0)]]
      // fecha_apertura se establecerá automáticamente al enviar
    });
  }

  ngOnInit(): void {
    // Verificar si el usuario es vendedor
    this.isVendedor = this.authService.isVendedor();
    
    // Si es vendedor, obtener su sucursal asignada
    if (this.isVendedor) {
      const currentUser = this.authService.getCurrentUser();
      if (currentUser && currentUser.sucursal_id) {
        this.currentUserSucursalId = currentUser.sucursal_id;
      }
    }

    // Reset form on init - establecer valores iniciales
    const initialValues: any = {
      saldo_inicial: 0
    };

    // Si es vendedor, establecer automáticamente la sucursal
    if (this.isVendedor && this.currentUserSucursalId) {
      initialValues.sucursal_id = this.currentUserSucursalId;
    } else {
      initialValues.sucursal_id = '';
    }

    this.form.reset(initialValues);
    
    // Asegurar que la sucursal esté establecida después del reset
    if (this.isVendedor && this.currentUserSucursalId) {
      setTimeout(() => {
        this.form.patchValue({
          sucursal_id: this.currentUserSucursalId
        }, { emitEvent: false });
      }, 0);
    }
  }

  onSubmit(): void {
    // Si es vendedor, asegurar que la sucursal esté establecida
    if (this.isVendedor && this.currentUserSucursalId) {
      this.form.patchValue({
        sucursal_id: this.currentUserSucursalId
      }, { emitEvent: false });
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Establecer fecha y hora de apertura automáticamente en formato MySQL/Laravel
    const now = new Date();
    const fechaApertura = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const formData = {
      ...this.form.value,
      fecha_apertura: fechaApertura,
      // Asegurar que la sucursal_id esté presente para vendedores
      sucursal_id: this.isVendedor && this.currentUserSucursalId 
        ? this.currentUserSucursalId 
        : this.form.value.sucursal_id
    };

    this.save.emit(formData);
  }

  onCancel(): void {
    this.cancel.emit();
  }

  getSucursalNombre(): string {
    if (!this.currentUserSucursalId) return '';
    const sucursal = this.sucursales.find(s => s.id === this.currentUserSucursalId);
    return sucursal ? sucursal.nombre : 'Sucursal asignada';
  }
}

