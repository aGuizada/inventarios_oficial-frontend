import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlmacenService } from '../../../services/almacen.service';
import { SucursalService } from '../../../services/sucursal.service';
import { Almacen, Sucursal, PaginationParams } from '../../../interfaces';
import { finalize } from 'rxjs/operators';

// Import child components
import { AlmacenesListComponent } from './almacenes-list/almacenes-list.component';
import { AlmacenFormComponent } from './almacen-form/almacen-form.component';
import { SearchBarComponent } from '../../../shared/components/search-bar/search-bar.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-almacenes',
  standalone: true,
  imports: [
    CommonModule,
    AlmacenesListComponent,
    AlmacenFormComponent,
    SearchBarComponent,
    PaginationComponent
  ],
  templateUrl: './almacenes.component.html',
})
export class AlmacenesComponent implements OnInit {
  almacenes: Almacen[] = [];
  sucursales: Sucursal[] = [];
  isLoading = false;
  isFormModalOpen = false;
  selectedAlmacen: Almacen | null = null;
  
  // Paginación
  currentPage: number = 1;
  lastPage: number = 1;
  total: number = 0;
  perPage: number = 15;
  searchTerm: string = '';

  constructor(
    private almacenService: AlmacenService,
    private sucursalService: SucursalService
  ) { }

  ngOnInit(): void {
    this.loadAlmacenes();
    this.loadSucursales();
  }

  loadAlmacenes(): void {
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
    
    this.almacenService.getPaginated(params)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          console.log('Respuesta de loadAlmacenes:', response);
          if (response.data) {
            this.almacenes = response.data.data || [];
            this.currentPage = response.data.current_page;
            this.lastPage = response.data.last_page;
            this.total = response.data.total;
            this.perPage = response.data.per_page;
            console.log('Almacenes cargados:', this.almacenes.length, 'almacenes');
            console.log('Almacenes:', this.almacenes);
          }
        },
        error: (error) => {
          console.error('Error loading almacenes', error);
          // Fallback a getAll si falla la paginación
          this.almacenService.getAll()
            .pipe(finalize(() => this.isLoading = false))
            .subscribe({
              next: (response) => {
                this.almacenes = response.data || [];
              }
            });
        }
      });
  }

  onSearch(search: string): void {
    this.searchTerm = search;
    this.currentPage = 1;
    this.loadAlmacenes();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadAlmacenes();
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
    this.selectedAlmacen = null;
    this.isFormModalOpen = true;
  }

  closeFormModal(): void {
    this.isFormModalOpen = false;
    this.selectedAlmacen = null;
  }

  onEdit(almacen: Almacen): void {
    console.log('onEdit llamado con almacen:', almacen);
    if (!almacen || !almacen.id) {
      console.error('Almacén inválido o sin ID:', almacen);
      alert('Error: No se puede editar este almacén. ID inválido.');
      return;
    }
    // Crear una copia del objeto para evitar problemas de referencia
    this.selectedAlmacen = { ...almacen };
    this.isFormModalOpen = true;
    console.log('Modal abierto, selectedAlmacen:', this.selectedAlmacen);
  }

  onDelete(id: number): void {
    console.log('onDelete llamado con id:', id);
    if (!id) {
      console.error('No se puede eliminar: ID no válido');
      alert('Error: No se puede eliminar este almacén. ID inválido.');
      return;
    }
    
    if (confirm('¿Está seguro de eliminar este almacén?')) {
      console.log('Confirmado, eliminando almacén con id:', id);
      this.isLoading = true;
      this.almacenService.delete(id)
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
          next: (response) => {
            console.log('Almacén eliminado exitosamente:', response);
            console.log('Recargando lista de almacenes...');
            
            // Si estamos en una página que podría quedar vacía después de eliminar,
            // volver a la primera página
            if (this.currentPage > 1 && this.almacenes.length === 1) {
              this.currentPage = 1;
            }
            
            this.loadAlmacenes();
            console.log('Lista recargada');
          },
          error: (error) => {
            console.error('Error deleting almacen', error);
            console.error('Detalles del error:', error.error);
            
            let errorMessage = 'Error al eliminar el almacén.';
            if (error.error) {
              if (error.error.message) {
                errorMessage = error.error.message;
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

  onSave(almacenData: Almacen): void {
    console.log('onSave recibido:', almacenData);
    console.log('selectedAlmacen:', this.selectedAlmacen);
    console.log('Es edición:', this.selectedAlmacen && this.selectedAlmacen.id);
    
    this.isLoading = true;
    const isEdit = this.selectedAlmacen && this.selectedAlmacen.id;
    const almacenId = this.selectedAlmacen?.id;
    
    if (isEdit && !almacenId) {
      console.error('Error: Modo edición pero sin ID válido');
      this.isLoading = false;
      alert('Error: No se puede editar el almacén sin un ID válido.');
      return;
    }
    
    const request = isEdit && almacenId
      ? this.almacenService.update(almacenId, almacenData)
      : this.almacenService.create(almacenData);

    console.log('Enviando request:', isEdit ? 'UPDATE' : 'CREATE');

    request
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          console.log('Respuesta del servidor:', response);
          this.loadAlmacenes();
          this.closeFormModal();
        },
        error: (error) => {
          console.error('Error saving almacen', error);
          console.error('Detalles del error:', error.error);
          
          let errorMessage = 'Error al guardar el almacén.';
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
