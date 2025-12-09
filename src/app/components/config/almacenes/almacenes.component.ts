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
          if (response.data) {
            this.almacenes = response.data.data || [];
            this.currentPage = response.data.current_page;
            this.lastPage = response.data.last_page;
            this.total = response.data.total;
            this.perPage = response.data.per_page;
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
    this.selectedAlmacen = almacen;
    this.isFormModalOpen = true;
  }

  onDelete(id: number): void {
    if (confirm('¿Está seguro de eliminar este almacén?')) {
      this.almacenService.delete(id).subscribe({
        next: () => this.loadAlmacenes(),
        error: (error) => console.error('Error deleting almacen', error)
      });
    }
  }

  onSave(almacenData: Almacen): void {
    this.isLoading = true;
    const request = this.selectedAlmacen && this.selectedAlmacen.id
      ? this.almacenService.update(this.selectedAlmacen.id, almacenData)
      : this.almacenService.create(almacenData);

    request
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          this.loadAlmacenes();
          this.closeFormModal();
        },
        error: (error) => console.error('Error saving almacen', error)
      });
  }
}
