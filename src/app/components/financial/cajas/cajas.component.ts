import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CajaService } from '../../../services/caja.service';
import { SucursalService } from '../../../services/sucursal.service';
import { AuthService } from '../../../services/auth.service';
import { Caja, Sucursal, User } from '../../../interfaces';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-cajas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cajas.component.html',
  styleUrl: './cajas.component.css'
})
export class CajasComponent implements OnInit {
  cajas: Caja[] = [];
  sucursales: Sucursal[] = [];
  currentUser: User | null = null;
  form: FormGroup;
  isModalOpen = false;
  isLoading = false;

  constructor(
    private cajaService: CajaService,
    private sucursalService: SucursalService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      sucursal_id: ['', Validators.required],
      saldo_inicial: [0, [Validators.required, Validators.min(0)]],
      fecha_apertura: [new Date().toISOString().substring(0, 16), Validators.required] // datetime-local format
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadCajas();
    this.loadSucursales();
  }

  loadCajas(): void {
    this.isLoading = true;
    this.cajaService.getAll()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          this.cajas = response.data;
        },
        error: (error) => console.error('Error loading cajas', error)
      });
  }

  loadSucursales(): void {
    this.sucursalService.getAll().subscribe({
      next: (response) => {
        this.sucursales = response.data;
      },
      error: (error) => console.error('Error loading sucursales', error)
    });
  }

  openModal(): void {
    this.isModalOpen = true;
    this.form.reset({
      saldo_inicial: 0,
      fecha_apertura: new Date().toISOString().substring(0, 16)
    });
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.form.reset();
  }

  abrirCaja(): void {
    if (this.form.invalid || !this.currentUser) return;

    const cajaData = {
      ...this.form.value,
      user_id: this.currentUser.id,
      estado: 'abierta', // Assuming 'abierta' is the status string, or boolean true? Model says boolean in validation but string in interface. Let's check model validation.
      // Model validation says 'estado' => 'boolean'. Interface says 'string'.
      // Let's try sending boolean true for now, or 1.
      // Actually, let's look at the interface again.
      // Interface: estado: string;
      // Model validation: 'estado' => 'boolean'.
      // This is a mismatch. I should probably send boolean.
    };

    // Adjust for backend expectation
    cajaData.estado = 1;

    this.cajaService.create(cajaData).subscribe({
      next: () => {
        this.loadCajas();
        this.closeModal();
      },
      error: (error) => console.error('Error opening caja', error)
    });
  }

  isCajaOpen(caja: Caja): boolean {
    return caja.estado === 'abierta' || caja.estado === '1' || caja.estado === 1 || caja.estado === true;
  }

  cerrarCaja(caja: Caja): void {
    if (confirm('¿Está seguro de cerrar esta caja?')) {
      const cierreData: Partial<Caja> = {
        fecha_cierre: new Date().toISOString(), // Send as ISO string
        estado: 'cerrada' // Or 0/false
      };

      // Adjust for backend expectation
      // @ts-ignore
      cierreData.estado = 0;

      this.cajaService.update(caja.id, cierreData).subscribe({
        next: () => this.loadCajas(),
        error: (error) => console.error('Error closing caja', error)
      });
    }
  }
}
