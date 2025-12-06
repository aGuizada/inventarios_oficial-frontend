import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MonedaService } from '../../../services/moneda.service';
import { EmpresaService } from '../../../services/empresa.service';
import { Moneda, Empresa, ApiResponse } from '../../../interfaces';
import { finalize } from 'rxjs/operators';

// Import child components
import { MonedasListComponent } from './monedas-list/monedas-list.component';
import { MonedaFormComponent } from './moneda-form/moneda-form.component';
import { TipoCambioFormComponent } from './tipo-cambio-form/tipo-cambio-form.component';

@Component({
  selector: 'app-monedas',
  standalone: true,
  imports: [
    CommonModule,
    MonedasListComponent,
    MonedaFormComponent,
    TipoCambioFormComponent
  ],
  templateUrl: './monedas.component.html',
})
export class MonedasComponent implements OnInit {
  monedas: Moneda[] = [];
  empresas: Empresa[] = [];
  isFormModalOpen = false;
  isTipoCambioModalOpen = false;
  isLoading = false;
  selectedMoneda: Moneda | null = null;
  monedaSeleccionada: Moneda | null = null;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private monedaService: MonedaService,
    private empresaService: EmpresaService
  ) { }

  ngOnInit(): void {
    // Cargar empresas primero para que estén disponibles cuando se carguen las monedas
    this.cargarEmpresas();
    this.cargarMonedas();
  }

  cargarEmpresas(): void {
    this.empresaService.getAll().subscribe({
      next: (response: ApiResponse<Empresa[]> | Empresa[] | any) => {
        // El backend devuelve {data: [...]} según EmpresaController
        if (response && response.data && Array.isArray(response.data)) {
          this.empresas = response.data;
          console.log('Empresas cargadas desde data:', this.empresas);
        } else if (Array.isArray(response)) {
          this.empresas = response;
          console.log('Empresas cargadas directamente:', this.empresas);
        } else if (response && 'success' in response) {
          if (response.success) {
            this.empresas = response.data || [];
            console.log('Empresas cargadas desde ApiResponse:', this.empresas);
          }
        } else {
          this.empresas = [];
          console.warn('Formato de respuesta de empresas no reconocido:', response);
        }
      },
      error: (error) => {
        console.error('Error al cargar empresas:', error);
        console.error('Respuesta completa:', error);
        this.mostrarError('Error al cargar las empresas. Por favor, intente nuevamente.');
      }
    });
  }

  cargarMonedas(): void {
    this.isLoading = true;
    this.monedaService.getAll()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response: ApiResponse<Moneda[]> | Moneda[]) => {
          // El backend puede devolver directamente el array o envuelto en ApiResponse
          if (Array.isArray(response)) {
            this.monedas = response;
            console.log('Monedas cargadas:', this.monedas);
            // Verificar si las empresas están cargadas
            this.monedas.forEach(moneda => {
              if (!moneda.empresa && moneda.empresa_id) {
                // Si no tiene empresa cargada pero tiene empresa_id, buscar en el array de empresas
                const empresa = this.empresas.find(e => e.id === moneda.empresa_id);
                if (empresa) {
                  moneda.empresa = empresa;
                }
              }
            });
          } else if (response && 'success' in response) {
            if (response.success) {
              this.monedas = response.data || [];
            } else {
              this.mostrarError(response.message || 'Error al cargar las monedas');
            }
          } else {
            this.monedas = [];
          }
        },
        error: (error) => {
          console.error('Error al cargar monedas:', error);
          this.mostrarError('Error al cargar las monedas. Por favor, intente nuevamente.');
        }
      });
  }

  openFormModal(): void {
    this.selectedMoneda = null;
    this.isFormModalOpen = true;
    this.limpiarMensajes();
  }

  closeFormModal(): void {
    this.isFormModalOpen = false;
    this.selectedMoneda = null;
    this.limpiarMensajes();
  }

  onEdit(moneda: Moneda): void {
    this.selectedMoneda = moneda;
    this.isFormModalOpen = true;
    this.limpiarMensajes();
  }

  onSave(monedaData: Moneda): void {
    this.isLoading = true;
    const operacion = this.selectedMoneda && this.selectedMoneda.id
      ? this.monedaService.update(this.selectedMoneda.id, monedaData)
      : this.monedaService.create(monedaData);

    operacion
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response: ApiResponse<Moneda> | Moneda) => {
          if (response && 'success' in response) {
            if (response.success) {
              this.mostrarExito(
                this.selectedMoneda 
                  ? 'Moneda actualizada exitosamente' 
                  : 'Moneda creada exitosamente'
              );
              this.cargarMonedas();
              this.closeFormModal();
            } else {
              this.mostrarError(response.message || 'Error al guardar la moneda');
            }
          } else {
            this.mostrarExito(
              this.selectedMoneda 
                ? 'Moneda actualizada exitosamente' 
                : 'Moneda creada exitosamente'
            );
            this.cargarMonedas();
            this.closeFormModal();
          }
        },
        error: (error) => {
          console.error('Error al guardar moneda:', error);
          let mensaje = 'Error al guardar la moneda. Por favor, intente nuevamente.';
          
          if (error.error) {
            if (error.error.errors) {
              const errores = Object.values(error.error.errors).flat();
              mensaje = errores.join(', ');
            } else if (error.error.message) {
              mensaje = error.error.message;
            }
          }
          
          this.mostrarError(mensaje);
        }
      });
  }

  onDelete(moneda: Moneda): void {
    if (!confirm(`¿Está seguro de que desea eliminar la moneda "${moneda.nombre}"?`)) {
      return;
    }

    this.isLoading = true;
    this.monedaService.delete(moneda.id)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response: ApiResponse<any> | any) => {
          if (response && 'success' in response) {
            if (response.success) {
              this.mostrarExito('Moneda eliminada exitosamente');
              this.cargarMonedas();
            } else {
              this.mostrarError(response.message || 'Error al eliminar la moneda');
            }
          } else {
            this.mostrarExito('Moneda eliminada exitosamente');
            this.cargarMonedas();
          }
        },
        error: (error) => {
          console.error('Error al eliminar moneda:', error);
          const mensaje = error.error?.message || 'Error al eliminar la moneda. Por favor, intente nuevamente.';
          this.mostrarError(mensaje);
        }
      });
  }

  actualizarTipoCambio(moneda: Moneda, nuevoTipoCambio: number): void {
    if (!nuevoTipoCambio || nuevoTipoCambio <= 0) {
      this.mostrarError('El tipo de cambio debe ser mayor a 0');
      return;
    }

    this.isLoading = true;
    this.monedaService.update(moneda.id, { tipo_cambio: nuevoTipoCambio })
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response: ApiResponse<Moneda> | Moneda) => {
          // El backend puede devolver directamente el objeto o envuelto en ApiResponse
          if (response && 'success' in response) {
            if (response.success) {
              this.mostrarExito('Tipo de cambio actualizado exitosamente');
              this.cargarMonedas();
            } else {
              this.mostrarError(response.message || 'Error al actualizar el tipo de cambio');
            }
          } else {
            // Respuesta directa del backend
            this.mostrarExito('Tipo de cambio actualizado exitosamente');
            this.cargarMonedas();
          }
        },
        error: (error) => {
          console.error('Error al actualizar tipo de cambio:', error);
          this.mostrarError('Error al actualizar el tipo de cambio. Por favor, intente nuevamente.');
        }
      });
  }

  mostrarError(mensaje: string): void {
    this.errorMessage = mensaje;
    this.successMessage = '';
    setTimeout(() => this.errorMessage = '', 5000);
  }

  mostrarExito(mensaje: string): void {
    this.successMessage = mensaje;
    this.errorMessage = '';
    setTimeout(() => this.successMessage = '', 5000);
  }

  limpiarMensajes(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }


  onUpdateTipoCambio(moneda: Moneda): void {
    this.monedaSeleccionada = moneda;
    this.isTipoCambioModalOpen = true;
    this.limpiarMensajes();
  }

  closeTipoCambioModal(): void {
    this.isTipoCambioModalOpen = false;
    this.monedaSeleccionada = null;
  }

  onSaveTipoCambio(nuevoTipoCambio: number): void {
    if (!this.monedaSeleccionada || !nuevoTipoCambio || nuevoTipoCambio <= 0) {
      this.mostrarError('El tipo de cambio debe ser mayor a 0');
      return;
    }

    this.actualizarTipoCambio(this.monedaSeleccionada, nuevoTipoCambio);
    this.closeTipoCambioModal();
  }

}
