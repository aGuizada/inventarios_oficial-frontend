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
    this.selectedSucursal = sucursal;
    this.isFormModalOpen = true;
  }

  onDelete(id: number): void {
    if (confirm('¿Está seguro de eliminar esta sucursal?')) {
      this.sucursalService.delete(id).subscribe({
        next: () => this.loadSucursales(),
        error: (error) => console.error('Error deleting sucursal', error)
      });
    }
  }

  onSave(sucursalData: Sucursal): void {
    this.isLoading = true;
    const request = this.selectedSucursal && this.selectedSucursal.id
      ? this.sucursalService.update(this.selectedSucursal.id, sucursalData)
      : this.sucursalService.create(sucursalData);

    request
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          this.loadSucursales();
          this.closeFormModal();
        },
        error: (error) => console.error('Error saving sucursal', error)
      });
  }
}
