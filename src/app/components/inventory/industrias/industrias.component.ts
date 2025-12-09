import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IndustriaService } from '../../../services/industria.service';
import { Industria, PaginationParams } from '../../../interfaces';
import { finalize } from 'rxjs/operators';

// Import child components
import { IndustriasListComponent } from './industrias-list/industrias-list.component';
import { IndustriaFormComponent } from './industria-form/industria-form.component';
import { SearchBarComponent } from '../../../shared/components/search-bar/search-bar.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-industrias',
  standalone: true,
  imports: [
    CommonModule,
    IndustriasListComponent,
    IndustriaFormComponent,
    SearchBarComponent,
    PaginationComponent
  ],
  templateUrl: './industrias.component.html',
})
export class IndustriasComponent implements OnInit {
  industrias: Industria[] = [];
  isLoading = false;
  isFormModalOpen = false;
  selectedIndustria: Industria | null = null;
  errorMessage = '';
  successMessage = '';
  
  // Paginación
  currentPage: number = 1;
  lastPage: number = 1;
  total: number = 0;
  perPage: number = 15;
  searchTerm: string = '';

  constructor(
    private industriaService: IndustriaService
  ) { }

  ngOnInit(): void {
    this.loadIndustrias();
  }

  loadIndustrias(): void {
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
    
    this.industriaService.getPaginated(params)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          if (response.data) {
            this.industrias = response.data.data || [];
            this.currentPage = response.data.current_page;
            this.lastPage = response.data.last_page;
            this.total = response.data.total;
            this.perPage = response.data.per_page;
          }
        },
        error: (error) => {
          this.errorMessage = 'Error al cargar industrias';
          console.error('Error loading industrias', error);
          // Fallback a getAll si falla la paginación
          this.industriaService.getAll()
            .pipe(finalize(() => this.isLoading = false))
            .subscribe({
              next: (response) => {
                this.industrias = response.data || [];
              }
            });
        }
      });
  }

  onSearch(search: string): void {
    this.searchTerm = search;
    this.currentPage = 1;
    this.loadIndustrias();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadIndustrias();
  }

  openFormModal(): void {
    this.selectedIndustria = null;
    this.isFormModalOpen = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  closeFormModal(): void {
    this.isFormModalOpen = false;
    this.selectedIndustria = null;
  }

  onEdit(industria: Industria): void {
    this.selectedIndustria = industria;
    this.isFormModalOpen = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  onDelete(id: number): void {
    if (confirm('¿Estás seguro de eliminar esta industria?')) {
      this.industriaService.delete(id).subscribe({
        next: () => {
          this.successMessage = 'Industria eliminada exitosamente';
          this.loadIndustrias();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Error al eliminar la industria';
          console.error('Error deleting industria', error);
        }
      });
    }
  }

  onSave(industriaData: Industria): void {
    this.isLoading = true;
    const request = this.selectedIndustria && this.selectedIndustria.id
      ? this.industriaService.update(this.selectedIndustria.id, industriaData)
      : this.industriaService.create(industriaData);

    request
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          this.successMessage = `Industria ${this.selectedIndustria ? 'actualizada' : 'creada'} exitosamente`;
          this.loadIndustrias();
          this.closeFormModal();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Error al guardar la industria';
          console.error('Error saving industria', error);
        }
      });
  }
}
