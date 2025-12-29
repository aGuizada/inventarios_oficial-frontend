import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SucursalService } from '../../../services/sucursal.service';
import { EmpresaService } from '../../../services/empresa.service';
import { Sucursal, Empresa, PaginationParams } from '../../../interfaces';
import { finalize } from 'rxjs/operators';

// Import child components
import { SucursalesListComponent } from './sucursales-list/sucursales-list.component';
import { SucursalFormComponent } from './sucursal-form/sucursal-form.component';
import { SearchBarComponent } from '../../../shared/components/search-bar/search-bar.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-sucursales',
  standalone: true,
  imports: [
    CommonModule,
    SucursalesListComponent,
    SucursalFormComponent,
    SearchBarComponent,
    PaginationComponent
  ],
  templateUrl: './sucursales.component.html',
})
export class SucursalesComponent implements OnInit {
  sucursales: Sucursal[] = [];
  empresas: Empresa[] = [];
  isLoading = false;
  isFormModalOpen = false;
  selectedSucursal: Sucursal | null = null;
  
  // Paginación
  currentPage: number = 1;
  lastPage: number = 1;
  total: number = 0;
  perPage: number = 15;
  searchTerm: string = '';

  constructor(
    private sucursalService: SucursalService,
    private empresaService: EmpresaService
  ) { }

  ngOnInit(): void {
    this.loadSucursales();
    this.loadEmpresas();
  }

  loadEmpresas(): void {
    this.empresaService.getAll().subscribe(res => this.empresas = res.data);
  }

  loadSucursales(): void {
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
    
    this.sucursalService.getPaginated(params)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          if (response.data) {
            this.sucursales = response.data.data || [];
            this.currentPage = response.data.current_page;
            this.lastPage = response.data.last_page;
            this.total = response.data.total;
            this.perPage = response.data.per_page;
          }
        },
        error: (error) => {
          console.error('Error loading sucursales', error);
          // Fallback a getAll si falla la paginación
          this.sucursalService.getAll()
            .pipe(finalize(() => this.isLoading = false))
            .subscribe({
              next: (response) => {
                this.sucursales = response.data || [];
              }
            });
        }
      });
  }

  onSearch(search: string): void {
    this.searchTerm = search;
    this.currentPage = 1;
    this.loadSucursales();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadSucursales();
  }

  openFormModal(): void {
    this.selectedSucursal = null;
    this.isFormModalOpen = true;
  }

  closeFormModal(): void {
    this.isFormModalOpen = false;
    this.selectedSucursal = null;
  }

  onEdit(sucursal: Sucursal): void {
    console.log('onEdit recibido en componente principal:', sucursal);
    if (!sucursal || !sucursal.id) {
      console.error('Sucursal inválida o sin ID:', sucursal);
      alert('Error: No se puede editar esta sucursal. ID inválido.');
      return;
    }
    // Crear una copia del objeto para evitar problemas de referencia
    this.selectedSucursal = { ...sucursal };
    this.isFormModalOpen = true;
    console.log('Modal abierto, selectedSucursal:', this.selectedSucursal);
  }

  onDelete(id: number): void {
    console.log('onDelete recibido en componente principal con id:', id);
    if (!id) {
      console.error('No se puede eliminar: ID no válido');
      alert('Error: No se puede eliminar esta sucursal. ID inválido.');
      return;
    }
    
    if (confirm('¿Está seguro de eliminar esta sucursal?')) {
      console.log('Confirmado, eliminando sucursal con id:', id);
      this.isLoading = true;
      this.sucursalService.delete(id)
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
          next: (response) => {
            console.log('Sucursal eliminada exitosamente:', response);
            if (response.success) {
              alert('Sucursal eliminada exitosamente');
              this.loadSucursales();
            } else {
              // Si el backend devuelve success: false pero no es un error HTTP
              const errorMessage = response.message || 'Error al eliminar la sucursal';
              alert(errorMessage);
            }
          },
          error: (error) => {
            console.error('Error deleting sucursal', error);
            console.error('Detalles del error:', error.error);
            
            let errorMessage = 'Error al eliminar la sucursal.';
            
            // Manejar diferentes formatos de respuesta de error
            if (error.error) {
              // Priorizar el mensaje detallado
              if (error.error.message) {
                errorMessage = error.error.message;
              } else if (error.error.error) {
                errorMessage = error.error.error;
              } else if (typeof error.error === 'string') {
                errorMessage = error.error;
              }
            } else if (error.message) {
              errorMessage = error.message;
            }
            
            // Mostrar mensaje de error al usuario
            alert(errorMessage);
          }
        });
    }
  }

  onSave(sucursalData: Sucursal): void {
    console.log('onSave recibido:', sucursalData);
    console.log('selectedSucursal:', this.selectedSucursal);
    console.log('Es edición:', this.selectedSucursal && this.selectedSucursal.id);
    
    this.isLoading = true;
    const isEdit = this.selectedSucursal && this.selectedSucursal.id;
    const sucursalId = this.selectedSucursal?.id;
    
    if (isEdit && !sucursalId) {
      console.error('Error: Modo edición pero sin ID válido');
      this.isLoading = false;
      alert('Error: No se puede editar la sucursal sin un ID válido.');
      return;
    }
    
    const request = isEdit && sucursalId
      ? this.sucursalService.update(sucursalId, sucursalData)
      : this.sucursalService.create(sucursalData);

    console.log('Enviando request:', isEdit ? 'UPDATE' : 'CREATE');

    request
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          console.log('Respuesta del servidor:', response);
          this.loadSucursales();
          this.closeFormModal();
        },
        error: (error) => {
          console.error('Error saving sucursal', error);
          console.error('Detalles del error:', error.error);
          
          let errorMessage = 'Error al guardar la sucursal.';
          if (error.error) {
            if (error.error.message) {
              errorMessage = error.error.message;
            } else if (error.error.errors) {
              // Errores de validación
              const validationErrors = Object.values(error.error.errors).flat().join(', ');
              errorMessage = 'Errores de validación: ' + validationErrors;
            } else if (error.error.error) {
              errorMessage = error.error.error;
            }
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          alert(errorMessage);
        }
      });
  }
}
