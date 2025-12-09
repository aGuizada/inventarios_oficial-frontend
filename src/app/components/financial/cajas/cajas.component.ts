import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CajaService } from '../../../services/caja.service';
import { SucursalService } from '../../../services/sucursal.service';
import { AuthService } from '../../../services/auth.service';
import { TransaccionCajaService } from '../../../services/transaccion-caja.service';
import { Caja, Sucursal, User, PaginationParams } from '../../../interfaces';
import { finalize } from 'rxjs/operators';

// Import child components
import { CajasListComponent } from './cajas-list/cajas-list.component';
import { CajaFormComponent } from './caja-form/caja-form.component';
import { CajaDetailComponent } from './caja-detail/caja-detail.component';
import { CajaTransaccionComponent } from './caja-transaccion/caja-transaccion.component';
import { CajaArqueoComponent } from './caja-arqueo/caja-arqueo.component';
import { SearchBarComponent } from '../../../shared/components/search-bar/search-bar.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-cajas',
  standalone: true,
  imports: [
    CommonModule,
    CajasListComponent,
    CajaFormComponent,
    CajaDetailComponent,
    CajaTransaccionComponent,
    CajaArqueoComponent,
    SearchBarComponent,
    PaginationComponent
  ],
  templateUrl: './cajas.component.html',
})
export class CajasComponent implements OnInit {
  cajas: Caja[] = [];
  sucursales: Sucursal[] = [];
  transacciones: any[] = [];
  currentUser: User | null = null;
  isFormModalOpen = false;
  isDetailModalOpen = false;
  isTransaccionModalOpen = false;
  isArqueoModalOpen = false;
  selectedCaja: Caja | null = null;
  transaccionTipo: 'ingreso' | 'egreso' = 'ingreso';
  isLoading = false;
  
  // Paginación
  currentPage: number = 1;
  lastPage: number = 1;
  total: number = 0;
  perPage: number = 15;
  searchTerm: string = '';

  constructor(
    private cajaService: CajaService,
    private sucursalService: SucursalService,
    private authService: AuthService,
    private transaccionCajaService: TransaccionCajaService
  ) { }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadTransacciones();
    this.loadCajas();
    this.loadSucursales();
  }

  loadTransacciones(): void {
    this.transaccionCajaService.getAll().subscribe({
      next: (response) => {
        this.transacciones = response.data || [];
        // Después de cargar transacciones, actualizar las cajas si ya están cargadas
        if (this.cajas.length > 0) {
          this.updateCajasWithTransacciones();
        }
      },
      error: (error) => {
        // Si falla, continuar sin transacciones
        this.transacciones = [];
      }
    });
  }

  loadCajas(): void {
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
    
    this.cajaService.getPaginated(params)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          if (response.data) {
            this.cajas = (response.data.data || []).map((caja: any) => ({
              ...caja,
              compras_contado: Number(caja.compras_contado) || 0,
              compras_credito: Number(caja.compras_credito) || 0,
              ventas_contado: Number(caja.ventas_contado) || 0,
              ventas_credito: Number(caja.ventas_credito) || 0,
              pagos_qr: Number(caja.pagos_qr) || 0,
              ventas: Number(caja.ventas) || 0,
              saldo_inicial: Number(caja.saldo_inicial) || 0,
              depositos: Number(caja.depositos) || 0,
              salidas: Number(caja.salidas) || 0,
              saldo_caja: caja.saldo_caja ? Number(caja.saldo_caja) : null
            }));
            
            this.currentPage = response.data.current_page;
            this.lastPage = response.data.last_page;
            this.total = response.data.total;
            this.perPage = response.data.per_page;
          }
          this.updateCajasWithTransacciones();
        },
        error: (error) => {
          console.error('Error loading cajas', error);
          // Fallback a getAll si falla la paginación
          this.cajaService.getAll()
            .pipe(finalize(() => this.isLoading = false))
            .subscribe({
              next: (response) => {
                this.cajas = (response.data || []).map((caja: any) => ({
                  ...caja,
                  compras_contado: Number(caja.compras_contado) || 0,
                  compras_credito: Number(caja.compras_credito) || 0,
                  ventas_contado: Number(caja.ventas_contado) || 0,
                  ventas_credito: Number(caja.ventas_credito) || 0,
                  pagos_qr: Number(caja.pagos_qr) || 0,
                  ventas: Number(caja.ventas) || 0,
                  saldo_inicial: Number(caja.saldo_inicial) || 0,
                  depositos: Number(caja.depositos) || 0,
                  salidas: Number(caja.salidas) || 0,
                  saldo_caja: caja.saldo_caja ? Number(caja.saldo_caja) : null
                }));
                this.updateCajasWithTransacciones();
              }
            });
        }
      });
  }
  
  onSearch(search: string): void {
    this.searchTerm = search;
    this.currentPage = 1;
    this.loadCajas();
  }
  
  onSearchClear(): void {
    this.searchTerm = '';
    this.currentPage = 1;
    this.loadCajas();
  }
  
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadCajas();
  }

  updateCajasWithTransacciones(): void {
    if (!this.cajas.length) return;

    // Calcular depositos y salidas desde transacciones para cada caja
    this.cajas = this.cajas.map(caja => {
      const transaccionesCaja = this.transacciones.filter((t: any) => t.caja_id === caja.id);
      
      // Calcular depositos (ingresos)
      const depositos = transaccionesCaja
        .filter((t: any) => t.transaccion === 'ingreso')
        .reduce((sum: number, t: any) => sum + (Number(t.importe) || 0), 0);
      
      // Calcular salidas (egresos)
      const salidas = transaccionesCaja
        .filter((t: any) => t.transaccion === 'egreso')
        .reduce((sum: number, t: any) => sum + (Number(t.importe) || 0), 0);

      // Siempre usar los valores calculados desde transacciones si existen
      // Si no hay transacciones, usar los valores de la BD
      return {
        ...caja,
        depositos: this.transacciones.length > 0 ? depositos : (Number(caja.depositos) || 0),
        salidas: this.transacciones.length > 0 ? salidas : (Number(caja.salidas) || 0)
      };
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
        next: (response) => {
          this.closeFormModal();
          // Recargar todo para actualizar en tiempo real
          this.loadTransacciones();
          this.loadCajas();
        },
        error: (error) => {
          const errorMessage = error.error?.message || error.error?.error || 'Error al abrir la caja';
          alert(`Error: ${errorMessage}`);
        }
      });
  }

  onClose(caja: Caja): void {
    // Abrir modal de arqueo en lugar de cerrar directamente
    this.selectedCaja = caja;
    this.isArqueoModalOpen = true;
  }

  onCloseArqueo(arqueoData: { saldoFisico: number, saldoFaltante: number }): void {
    if (!this.selectedCaja) return;

    // Formatear fecha de cierre en formato MySQL/Laravel
    const now = new Date();
    const fechaCierre = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    // Incluir todos los campos requeridos por el backend
    const cierreData: any = {
      sucursal_id: this.selectedCaja.sucursal_id,
      user_id: this.selectedCaja.user_id,
      fecha_apertura: this.selectedCaja.fecha_apertura,
      fecha_cierre: fechaCierre,
      saldo_inicial: Number(this.selectedCaja.saldo_inicial) || 0,
      depositos: Number(this.selectedCaja.depositos) || 0,
      salidas: Number(this.selectedCaja.salidas) || 0,
      ventas: Number(this.selectedCaja.ventas) || 0,
      ventas_contado: Number(this.selectedCaja.ventas_contado) || 0,
      ventas_credito: Number(this.selectedCaja.ventas_credito) || 0,
      pagos_efectivo: Number(this.selectedCaja.pagos_efectivo) || 0,
      pagos_qr: Number(this.selectedCaja.pagos_qr) || 0,
      pagos_transferencia: Number(this.selectedCaja.pagos_transferencia) || 0,
      cuotas_ventas_credito: Number(this.selectedCaja.cuotas_ventas_credito) || 0,
      compras_contado: Number(this.selectedCaja.compras_contado) || 0,
      compras_credito: Number(this.selectedCaja.compras_credito) || 0,
      saldo_caja: arqueoData.saldoFisico,
      saldo_faltante: arqueoData.saldoFaltante,
      estado: 0
    };

    this.isLoading = true;
    this.cajaService.update(this.selectedCaja.id, cierreData)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          this.closeArqueoModal();
          // Recargar todo para actualizar en tiempo real
          this.loadTransacciones();
          this.loadCajas();
        },
        error: (error) => {
          let errorMessage = 'Error al cerrar la caja';
          
          if (error.error) {
            if (error.error.message) {
              errorMessage = error.error.message;
            } else if (error.error.error) {
              errorMessage = error.error.error;
            } else if (error.error.errors) {
              // Si hay errores de validación de Laravel
              const validationErrors = Object.values(error.error.errors).flat().join(', ');
              errorMessage = `Errores de validación: ${validationErrors}`;
            }
          }
          
          alert(`Error: ${errorMessage}`);
        }
      });
  }

  closeArqueoModal(): void {
    this.isArqueoModalOpen = false;
    this.selectedCaja = null;
  }

  onResumenArqueo(): void {
    // El PDF se genera directamente en el componente de arqueo
    // No necesitamos hacer nada aquí, el evento solo se emite para mantener la estructura
  }

  onView(caja: Caja): void {
    this.selectedCaja = caja;
    this.isDetailModalOpen = true;
  }

  closeDetailModal(): void {
    this.isDetailModalOpen = false;
    this.selectedCaja = null;
  }

  onAddMoney(caja: Caja): void {
    this.selectedCaja = caja;
    this.transaccionTipo = 'ingreso';
    this.isTransaccionModalOpen = true;
  }

  onWithdrawMoney(caja: Caja): void {
    this.selectedCaja = caja;
    this.transaccionTipo = 'egreso';
    this.isTransaccionModalOpen = true;
  }

  onSaveTransaccion(transaccionData: any): void {
    this.isLoading = true;
    this.transaccionCajaService.create(transaccionData)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          // Cerrar el modal primero
          this.closeTransaccionModal();
          // Recargar transacciones primero, y cuando termine, actualizar las cajas
          this.transaccionCajaService.getAll().subscribe({
            next: (transaccionesResponse) => {
              this.transacciones = transaccionesResponse.data || [];
              // Ahora recargar las cajas y actualizar con las transacciones
              this.loadCajas();
            },
            error: () => {
              // Si falla cargar transacciones, solo recargar cajas
              this.loadCajas();
            }
          });
        },
        error: (error) => {
          let errorMessage = 'Error al guardar la transacción';
          
          if (error.error) {
            if (error.error.message) {
              errorMessage = error.error.message;
            } else if (error.error.error) {
              errorMessage = error.error.error;
            } else if (typeof error.error === 'string') {
              errorMessage = error.error;
            } else if (error.error.errors) {
              // Si hay errores de validación de Laravel
              const validationErrors = Object.values(error.error.errors).flat().join(', ');
              errorMessage = `Errores de validación: ${validationErrors}`;
            }
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          alert(`Error: ${errorMessage}\n\nCódigo: ${error.status || 'N/A'}`);
        }
      });
  }

  closeTransaccionModal(): void {
    this.isTransaccionModalOpen = false;
    this.selectedCaja = null;
  }
}
