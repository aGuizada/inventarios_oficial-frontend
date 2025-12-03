import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TransaccionCajaService } from '../../../services/transaccion-caja.service';
import { CajaService } from '../../../services/caja.service';
import { AuthService } from '../../../services/auth.service';
import { TransaccionCaja, Caja } from '../../../interfaces';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-transacciones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './transacciones.component.html',
  styleUrl: './transacciones.component.css'
})
export class TransaccionesComponent implements OnInit {
  transacciones: TransaccionCaja[] = [];
  cajas: Caja[] = [];
  form: FormGroup;
  isModalOpen = false;
  isLoading = false;

  constructor(
    private transaccionService: TransaccionCajaService,
    private cajaService: CajaService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      caja_id: ['', Validators.required],
      transaccion: ['ingreso', Validators.required], // ingreso | egreso
      importe: ['', [Validators.required, Validators.min(0.01)]],
      descripcion: ['', Validators.required],
      referencia: [''],
      fecha: [new Date().toISOString().substring(0, 10), Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadTransacciones();
    this.loadCajas();
  }

  loadCajas(): void {
    this.cajaService.getAll().subscribe(res => this.cajas = res.data);
  }

  loadTransacciones(): void {
    this.isLoading = true;
    this.transaccionService.getAll()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          this.transacciones = response.data;
        },
        error: (error) => console.error('Error loading transacciones', error)
      });
  }

  openModal(): void {
    this.isModalOpen = true;
    this.form.reset({
      transaccion: 'ingreso',
      fecha: new Date().toISOString().substring(0, 10)
    });
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.form.reset();
  }

  save(): void {
    if (this.form.invalid) return;

    const transaccionData = {
      ...this.form.value,
      user_id: this.authService.getCurrentUser()?.id
    };

    this.transaccionService.create(transaccionData).subscribe({
      next: () => {
        this.loadTransacciones();
        this.closeModal();
      },
      error: (error) => console.error('Error creating transaccion', error)
    });
  }
}
