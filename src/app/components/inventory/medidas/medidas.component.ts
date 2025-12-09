import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MedidaService } from '../../../services/medida.service';
import { Medida, PaginationParams } from '../../../interfaces';
import { finalize } from 'rxjs/operators';

// Import child components
import { MedidasListComponent } from './medidas-list/medidas-list.component';
import { MedidaFormComponent } from './medida-form/medida-form.component';
import { SearchBarComponent } from '../../../shared/components/search-bar/search-bar.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-medidas',
  standalone: true,
  imports: [
    CommonModule,
    MedidasListComponent,
    MedidaFormComponent,
    SearchBarComponent,
    PaginationComponent
  ],
  templateUrl: './medidas.component.html',
})
export class MedidasComponent implements OnInit {
  medidas: Medida[] = [];
  isLoading = false;
  isFormModalOpen = false;
  selectedMedida: Medida | null = null;
  errorMessage = '';
  successMessage = '';
  
  // Paginación
  currentPage: number = 1;
  lastPage: number = 1;
  total: number = 0;
  perPage: number = 15;
  searchTerm: string = '';

  constructor(
    private medidaService: MedidaService
  ) { }

  ngOnInit(): void {
    this.loadMedidas();
  }

  loadMedidas(): void {
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
    
    this.medidaService.getPaginated(params)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          if (response.data) {
            this.medidas = response.data.data || [];
            this.currentPage = response.data.current_page;
            this.lastPage = response.data.last_page;
            this.total = response.data.total;
            this.perPage = response.data.per_page;
          }
        },
        error: (error) => {
          this.errorMessage = 'Error al cargar medidas';
          console.error('Error loading medidas', error);
          // Fallback a getAll si falla la paginación
          this.medidaService.getAll()
            .pipe(finalize(() => this.isLoading = false))
            .subscribe({
              next: (response) => {
                this.medidas = response.data || [];
              }
            });
        }
      });
  }

  onSearch(search: string): void {
    this.searchTerm = search;
    this.currentPage = 1;
    this.loadMedidas();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadMedidas();
  }

  openFormModal(): void {
    this.selectedMedida = null;
    this.isFormModalOpen = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  closeFormModal(): void {
    this.isFormModalOpen = false;
    this.selectedMedida = null;
  }

  onEdit(medida: Medida): void {
    this.selectedMedida = medida;
    this.isFormModalOpen = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  onDelete(id: number): void {
    if (confirm('¿Estás seguro de eliminar esta medida?')) {
      this.medidaService.delete(id).subscribe({
        next: () => {
          this.successMessage = 'Medida eliminada exitosamente';
          this.loadMedidas();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Error al eliminar la medida';
          console.error('Error deleting medida', error);
        }
      });
    }
  }

  onSave(medidaData: Medida): void {
    this.isLoading = true;
    const request = this.selectedMedida && this.selectedMedida.id
      ? this.medidaService.update(this.selectedMedida.id, medidaData)
      : this.medidaService.create(medidaData);

    request
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          this.successMessage = `Medida ${this.selectedMedida ? 'actualizada' : 'creada'} exitosamente`;
          this.loadMedidas();
          this.closeFormModal();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Error al guardar la medida';
          console.error('Error saving medida', error);
        }
      });
  }
}
