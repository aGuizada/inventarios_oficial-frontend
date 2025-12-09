import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmpresaService } from '../../../services/empresa.service';
import { Empresa, PaginationParams } from '../../../interfaces';
import { finalize } from 'rxjs/operators';

// Import child components
import { EmpresasListComponent } from './empresas-list/empresas-list.component';
import { EmpresaFormComponent } from './empresa-form/empresa-form.component';
import { SearchBarComponent } from '../../../shared/components/search-bar/search-bar.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-empresas',
  standalone: true,
  imports: [
    CommonModule,
    EmpresasListComponent,
    EmpresaFormComponent,
    SearchBarComponent,
    PaginationComponent
  ],
  templateUrl: './empresas.component.html',
})
export class EmpresasComponent implements OnInit {
  empresas: Empresa[] = [];
  isLoading = false;
  isFormModalOpen = false;
  selectedEmpresa: Empresa | null = null;
  
  // Paginación
  currentPage: number = 1;
  lastPage: number = 1;
  total: number = 0;
  perPage: number = 15;
  searchTerm: string = '';

  constructor(
    private empresaService: EmpresaService
  ) { }

  ngOnInit(): void {
    this.loadEmpresas();
  }

  loadEmpresas(): void {
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
    
    this.empresaService.getPaginated(params)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          if (response.data) {
            this.empresas = response.data.data || [];
            this.currentPage = response.data.current_page;
            this.lastPage = response.data.last_page;
            this.total = response.data.total;
            this.perPage = response.data.per_page;
          }
        },
        error: (error) => {
          console.error('Error loading empresas', error);
          // Fallback a getAll si falla la paginación
          this.empresaService.getAll()
            .pipe(finalize(() => this.isLoading = false))
            .subscribe({
              next: (response) => {
                this.empresas = response.data || [];
              }
            });
        }
      });
  }

  onSearch(search: string): void {
    this.searchTerm = search;
    this.currentPage = 1;
    this.loadEmpresas();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadEmpresas();
  }

  openFormModal(): void {
    this.selectedEmpresa = null;
    this.isFormModalOpen = true;
  }

  closeFormModal(): void {
    this.isFormModalOpen = false;
    this.selectedEmpresa = null;
  }

  onEdit(empresa: Empresa): void {
    this.selectedEmpresa = empresa;
    this.isFormModalOpen = true;
  }

  onDelete(id: number): void {
    if (confirm('¿Está seguro de eliminar esta empresa?')) {
      this.empresaService.delete(id).subscribe({
        next: () => this.loadEmpresas(),
        error: (error) => console.error('Error deleting empresa', error)
      });
    }
  }

  onSave(empresaData: Empresa): void {
    this.isLoading = true;
    const request = this.selectedEmpresa && this.selectedEmpresa.id
      ? this.empresaService.update(this.selectedEmpresa.id, empresaData)
      : this.empresaService.create(empresaData);

    request
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          this.loadEmpresas();
          this.closeFormModal();
        },
        error: (error) => console.error('Error saving empresa', error)
      });
  }
}
