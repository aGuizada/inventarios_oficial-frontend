import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CajaService } from '../../../services/caja.service';
import { SucursalService } from '../../../services/sucursal.service';
import { AuthService } from '../../../services/auth.service';
import { Caja, Sucursal, User } from '../../../interfaces';
import { finalize } from 'rxjs/operators';

// Import child components
import { CajasListComponent } from './cajas-list/cajas-list.component';
import { CajaFormComponent } from './caja-form/caja-form.component';

@Component({
  selector: 'app-cajas',
  standalone: true,
  imports: [
    CommonModule,
    CajasListComponent,
    CajaFormComponent
  ],
  templateUrl: './cajas.component.html',
})
export class CajasComponent implements OnInit {
  cajas: Caja[] = [];
  sucursales: Sucursal[] = [];
  currentUser: User | null = null;
  isFormModalOpen = false;
  isLoading = false;

  constructor(
    private cajaService: CajaService,
    private sucursalService: SucursalService,
    private authService: AuthService
  ) { }

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

  openFormModal(): void {
    this.isFormModalOpen = true;
  }

  closeFormModal(): void {
    this.isFormModalOpen = false;
  }

  onSave(cajaData: any): void {
    if (!this.currentUser) return;

    const data = {
      ...cajaData,
      user_id: this.currentUser.id,
      estado: 1
    };

    this.isLoading = true;
    this.cajaService.create(data)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          this.loadCajas();
          this.closeFormModal();
        },
        error: (error) => console.error('Error opening caja', error)
      });
  }

  onClose(caja: Caja): void {
    if (confirm('¿Está seguro de cerrar esta caja?')) {
      const cierreData: any = {
        fecha_cierre: new Date().toISOString(),
        estado: 0
      };

      this.isLoading = true;
      this.cajaService.update(caja.id, cierreData)
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
          next: () => this.loadCajas(),
          error: (error) => console.error('Error closing caja', error)
        });
    }
  }
}
