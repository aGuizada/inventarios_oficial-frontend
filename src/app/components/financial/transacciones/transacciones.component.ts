import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransaccionCajaService } from '../../../services/transaccion-caja.service';
import { CajaService } from '../../../services/caja.service';
import { AuthService } from '../../../services/auth.service';
import { TransaccionCaja, Caja } from '../../../interfaces';
import { finalize } from 'rxjs/operators';

// Import child components
import { TransaccionesListComponent } from './transacciones-list/transacciones-list.component';
import { TransaccionFormComponent } from './transaccion-form/transaccion-form.component';

@Component({
  selector: 'app-transacciones',
  standalone: true,
  imports: [
    CommonModule,
    TransaccionesListComponent,
    TransaccionFormComponent
  ],
  templateUrl: './transacciones.component.html',
})
export class TransaccionesComponent implements OnInit {
  transacciones: TransaccionCaja[] = [];
  cajas: Caja[] = [];
  isFormModalOpen = false;
  isLoading = false;

  constructor(
    private transaccionService: TransaccionCajaService,
    private cajaService: CajaService,
    private authService: AuthService
  ) { }

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

  openFormModal(): void {
    this.isFormModalOpen = true;
  }

  closeFormModal(): void {
    this.isFormModalOpen = false;
  }

  onSave(transaccionData: any): void {
    const data = {
      ...transaccionData,
      user_id: this.authService.getCurrentUser()?.id
    };

    this.isLoading = true;
    this.transaccionService.create(data)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          this.loadTransacciones();
          this.closeFormModal();
        },
        error: (error) => console.error('Error creating transaccion', error)
      });
  }
}
