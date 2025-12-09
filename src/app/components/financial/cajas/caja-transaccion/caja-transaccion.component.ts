import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Caja, User } from '../../../../interfaces';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-caja-transaccion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './caja-transaccion.component.html',
})
export class CajaTransaccionComponent implements OnInit {
  @Input() caja: Caja | null = null;
  @Input() tipo: 'ingreso' | 'egreso' = 'ingreso';

  @Output() save = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;
  currentUser: User | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.form = this.fb.group({
      importe: [0, [Validators.required, Validators.min(0.01)]],
      descripcion: ['']
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    // Reset form on init
    this.form.reset({
      importe: 0,
      descripcion: this.tipo === 'ingreso' ? 'Ingreso manual de dinero' : 'Retiro manual de dinero'
    });
  }

  onSubmit(): void {
    if (this.form.invalid || !this.currentUser || !this.caja) {
      if (!this.currentUser) {
        alert('No se pudo obtener la información del usuario');
      }
      if (!this.caja) {
        alert('No se pudo obtener la información de la caja');
      }
      this.form.markAllAsTouched();
      return;
    }

    // Preparar datos de transacción
    const now = new Date();
    // Formato de fecha: YYYY-MM-DD HH:mm:ss (formato MySQL/Laravel)
    const fecha = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const transaccionData: any = {
      caja_id: this.caja.id,
      user_id: this.currentUser.id,
      fecha: fecha,
      transaccion: this.tipo,
      importe: Number(this.form.value.importe),
      descripcion: this.form.value.descripcion || (this.tipo === 'ingreso' ? 'Ingreso manual de dinero' : 'Retiro manual de dinero')
    };

    this.save.emit(transaccionData);
  }

  onCancel(): void {
    this.cancel.emit();
  }

  getTitle(): string {
    return this.tipo === 'ingreso' ? 'Agregar Dinero a la Caja' : 'Retirar Dinero de la Caja';
  }

  getButtonText(): string {
    return this.tipo === 'ingreso' ? 'Agregar Dinero' : 'Retirar Dinero';
  }
}

