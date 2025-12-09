import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarcaService } from '../../../services/marca.service';
import { Marca, PaginationParams } from '../../../interfaces';
import { finalize } from 'rxjs/operators';

// Import child components
import { MarcasListComponent } from './marcas-list/marcas-list.component';
import { MarcaFormComponent } from './marca-form/marca-form.component';
import { SearchBarComponent } from '../../../shared/components/search-bar/search-bar.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-marcas',
  standalone: true,
  imports: [
    CommonModule,
    MarcasListComponent,
    MarcaFormComponent,
    SearchBarComponent,
    PaginationComponent
  ],
  templateUrl: './marcas.component.html',
})
export class MarcasComponent implements OnInit {
  marcas: Marca[] = [];
  isLoading = false;
  isFormModalOpen = false;
  selectedMarca: Marca | null = null;
  errorMessage = '';
  successMessage = '';
  
  // Paginación
  currentPage: number = 1;
  lastPage: number = 1;
  total: number = 0;
  perPage: number = 15;
  searchTerm: string = '';

  constructor(
    private marcaService: MarcaService
  ) { }

  ngOnInit(): void {
    this.loadMarcas();
  }

  loadMarcas(): void {
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
    
    this.marcaService.getPaginated(params)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          if (response.data) {
            this.marcas = response.data.data || [];
            this.currentPage = response.data.current_page;
            this.lastPage = response.data.last_page;
            this.total = response.data.total;
            this.perPage = response.data.per_page;
          }
        },
        error: (error) => {
          this.errorMessage = 'Error al cargar marcas';
          console.error('Error loading marcas', error);
          // Fallback a getAll si falla la paginación
          this.marcaService.getAll()
            .pipe(finalize(() => this.isLoading = false))
            .subscribe({
              next: (response) => {
                this.marcas = response.data || [];
              }
            });
        }
      });
  }

  onSearch(search: string): void {
    this.searchTerm = search;
    this.currentPage = 1;
    this.loadMarcas();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadMarcas();
  }

  openFormModal(): void {
    this.selectedMarca = null;
    this.isFormModalOpen = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  closeFormModal(): void {
    this.isFormModalOpen = false;
    this.selectedMarca = null;
  }

  onEdit(marca: Marca): void {
    this.selectedMarca = marca;
    this.isFormModalOpen = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  onDelete(id: number): void {
    if (confirm('¿Estás seguro de eliminar esta marca?')) {
      this.marcaService.delete(id).subscribe({
        next: () => {
          this.successMessage = 'Marca eliminada exitosamente';
          this.loadMarcas();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Error al eliminar la marca';
          console.error('Error deleting marca', error);
        }
      });
    }
  }

  onSave(marcaData: Marca): void {
    this.isLoading = true;
    const request = this.selectedMarca && this.selectedMarca.id
      ? this.marcaService.update(this.selectedMarca.id, marcaData)
      : this.marcaService.create(marcaData);

    request
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          this.successMessage = `Marca ${this.selectedMarca ? 'actualizada' : 'creada'} exitosamente`;
          this.loadMarcas();
          this.closeFormModal();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Error al guardar la marca';
          console.error('Error saving marca', error);
        }
      });
  }
}
