import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProveedorService } from '../../../services/proveedor.service';
import { Proveedor, PaginationParams } from '../../../interfaces';
import { finalize } from 'rxjs/operators';

// Import child components
import { ProveedoresListComponent } from './proveedores-list/proveedores-list.component';
import { ProveedorFormComponent } from './proveedor-form/proveedor-form.component';
import { SearchBarComponent } from '../../../shared/components/search-bar/search-bar.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [
    CommonModule,
    ProveedoresListComponent,
    ProveedorFormComponent,
    SearchBarComponent,
    PaginationComponent
  ],
  templateUrl: './proveedores.component.html',
})
export class ProveedoresComponent implements OnInit {
  proveedores: Proveedor[] = [];
  isLoading = false;
  isFormModalOpen = false;
  selectedProveedor: Proveedor | null = null;
  
  // Paginación
  currentPage: number = 1;
  lastPage: number = 1;
  total: number = 0;
  perPage: number = 15;
  searchTerm: string = '';

  constructor(
    private proveedorService: ProveedorService
  ) { }

  ngOnInit(): void {
    this.loadProveedores();
  }

  loadProveedores(): void {
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
    
    this.proveedorService.getPaginated(params)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          if (response.data) {
            this.proveedores = response.data.data || [];
            this.currentPage = response.data.current_page;
            this.lastPage = response.data.last_page;
            this.total = response.data.total;
            this.perPage = response.data.per_page;
          }
        },
        error: (error) => {
          console.error('Error loading proveedores', error);
          // Fallback a getAll si falla la paginación
          this.proveedorService.getAll()
            .pipe(finalize(() => this.isLoading = false))
            .subscribe({
              next: (response) => {
                this.proveedores = response.data || [];
              }
            });
        }
      });
  }

  onSearch(search: string): void {
    this.searchTerm = search;
    this.currentPage = 1;
    this.loadProveedores();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadProveedores();
  }

  openFormModal(): void {
    this.selectedProveedor = null;
    this.isFormModalOpen = true;
  }

  closeFormModal(): void {
    this.isFormModalOpen = false;
    this.selectedProveedor = null;
  }

  onEdit(proveedor: Proveedor): void {
    this.selectedProveedor = proveedor;
    this.isFormModalOpen = true;
  }

  onDelete(id: number): void {
    if (confirm('¿Está seguro de eliminar este proveedor?')) {
      this.proveedorService.delete(id).subscribe({
        next: () => this.loadProveedores(),
        error: (error) => console.error('Error deleting proveedor', error)
      });
    }
  }

  onSave(proveedorData: Proveedor): void {
    this.isLoading = true;
    const request = this.selectedProveedor && this.selectedProveedor.id
      ? this.proveedorService.update(this.selectedProveedor.id, proveedorData)
      : this.proveedorService.create(proveedorData);

    request
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          this.loadProveedores();
          this.closeFormModal();
        },
        error: (error) => console.error('Error saving proveedor', error)
      });
  }
}
