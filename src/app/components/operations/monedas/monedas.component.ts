import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { MonedaService } from '../../../services/moneda.service';
import { EmpresaService } from '../../../services/empresa.service';
import { Moneda, Empresa, ApiResponse } from '../../../interfaces';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-monedas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './monedas.component.html',
})
export class MonedasComponent implements OnInit {
  monedas: Moneda[] = [];
  empresas: Empresa[] = [];
  form: FormGroup;
  formTipoCambio: FormGroup;
  isModalOpen = false;
  isEditing = false;
  isLoading = false;
  currentId: number | null = null;
  errorMessage: string = '';
  successMessage: string = '';
  isModalTipoCambioOpen = false;
  monedaSeleccionada: Moneda | null = null;

  constructor(
    private monedaService: MonedaService,
    private empresaService: EmpresaService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      empresa_id: ['', [Validators.required]],
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      pais: ['', [Validators.maxLength(50)]],
      simbolo: ['', [Validators.maxLength(10)]],
      tipo_cambio: [1, [Validators.required, Validators.min(0.0001)]],
      estado: [true]
    });

    this.formTipoCambio = this.fb.group({
      nuevoTipoCambio: [0, [Validators.required, Validators.min(0.0001)]]
    });
  }

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

  abrirModalCrear(): void {
    this.isEditing = false;
    this.currentId = null;
    this.form.reset({
      empresa_id: '',
      nombre: '',
      pais: '',
      simbolo: '',
      tipo_cambio: 1,
      estado: true
    });
    this.form.markAsUntouched();
    this.limpiarMensajes();
    this.isModalOpen = true;
  }

  abrirModalEditar(moneda: Moneda): void {
    this.isEditing = true;
    this.currentId = moneda.id;
    this.form.patchValue({
      empresa_id: moneda.empresa_id,
      nombre: moneda.nombre,
      pais: moneda.pais || '',
      simbolo: moneda.simbolo,
      tipo_cambio: moneda.tipo_cambio,
      estado: moneda.estado !== undefined ? moneda.estado : true
    });
    this.form.markAsUntouched();
    this.limpiarMensajes();
    this.isModalOpen = true;
  }

  cerrarModal(): void {
    this.isModalOpen = false;
    this.isEditing = false;
    this.currentId = null;
    this.form.reset();
    this.limpiarMensajes();
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.mostrarError('Por favor, complete todos los campos requeridos correctamente.');
      return;
    }

    this.isLoading = true;
    const monedaData = this.form.value;

    const operacion = this.isEditing && this.currentId
      ? this.monedaService.update(this.currentId, monedaData)
      : this.monedaService.create(monedaData);

    operacion
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response: ApiResponse<Moneda> | Moneda) => {
          // El backend puede devolver directamente el objeto o envuelto en ApiResponse
          if (response && 'success' in response) {
            if (response.success) {
              this.mostrarExito(
                this.isEditing 
                  ? 'Moneda actualizada exitosamente' 
                  : 'Moneda creada exitosamente'
              );
              this.cargarMonedas();
              this.cerrarModal();
            } else {
              this.mostrarError(response.message || 'Error al guardar la moneda');
            }
          } else {
            // Respuesta directa del backend
            this.mostrarExito(
              this.isEditing 
                ? 'Moneda actualizada exitosamente' 
                : 'Moneda creada exitosamente'
            );
            this.cargarMonedas();
            this.cerrarModal();
          }
        },
        error: (error) => {
          console.error('Error al guardar moneda:', error);
          let mensaje = 'Error al guardar la moneda. Por favor, intente nuevamente.';
          
          if (error.error) {
            // Si hay errores de validación del backend
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

  eliminar(moneda: Moneda): void {
    if (!confirm(`¿Está seguro de que desea eliminar la moneda "${moneda.nombre}"?`)) {
      return;
    }

    this.isLoading = true;
    this.monedaService.delete(moneda.id)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response: ApiResponse<any> | any) => {
          // El backend puede devolver directamente o envuelto en ApiResponse
          if (response && 'success' in response) {
            if (response.success) {
              this.mostrarExito('Moneda eliminada exitosamente');
              this.cargarMonedas();
            } else {
              this.mostrarError(response.message || 'Error al eliminar la moneda');
            }
          } else {
            // Respuesta directa del backend (204 No Content o similar)
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

  getFieldError(fieldName: string): string {
    const field = this.form.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} es requerido`;
      }
      if (field.errors['minlength']) {
        return `${this.getFieldLabel(fieldName)} debe tener al menos ${field.errors['minlength'].requiredLength} caracteres`;
      }
      if (field.errors['maxlength']) {
        return `${this.getFieldLabel(fieldName)} debe tener máximo ${field.errors['maxlength'].requiredLength} caracteres`;
      }
      if (field.errors['min']) {
        return `${this.getFieldLabel(fieldName)} debe ser mayor a ${field.errors['min'].min}`;
      }
    }
    return '';
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      empresa_id: 'Empresa',
      nombre: 'Nombre',
      pais: 'País',
      simbolo: 'Símbolo',
      tipo_cambio: 'Tipo de cambio',
      estado: 'Estado'
    };
    return labels[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field?.invalid && field.touched);
  }

  actualizarTipoCambioRapido(moneda: Moneda): void {
    this.monedaSeleccionada = moneda;
    this.formTipoCambio.patchValue({
      nuevoTipoCambio: moneda.tipo_cambio
    });
    this.isModalTipoCambioOpen = true;
    this.limpiarMensajes();
  }

  cerrarModalTipoCambio(): void {
    this.isModalTipoCambioOpen = false;
    this.monedaSeleccionada = null;
    this.formTipoCambio.reset({ nuevoTipoCambio: 0 });
  }

  confirmarActualizarTipoCambio(): void {
    if (this.formTipoCambio.invalid) {
      this.formTipoCambio.markAllAsTouched();
      this.mostrarError('Por favor, ingrese un tipo de cambio válido (mayor a 0)');
      return;
    }

    const nuevoTipoCambio = this.formTipoCambio.get('nuevoTipoCambio')?.value;
    if (!this.monedaSeleccionada || !nuevoTipoCambio || nuevoTipoCambio <= 0) {
      this.mostrarError('El tipo de cambio debe ser mayor a 0');
      return;
    }

    this.actualizarTipoCambio(this.monedaSeleccionada, nuevoTipoCambio);
    this.cerrarModalTipoCambio();
  }

  getEmpresaNombre(moneda: Moneda): string {
    // Si tiene la relación empresa cargada
    if (moneda.empresa && moneda.empresa.nombre) {
      return moneda.empresa.nombre;
    }
    // Si no tiene la relación pero tiene empresa_id, buscar en el array de empresas
    if (moneda.empresa_id && this.empresas.length > 0) {
      const empresa = this.empresas.find(e => e.id === moneda.empresa_id);
      if (empresa) {
        return empresa.nombre;
      }
    }
    return 'N/A';
  }

}
