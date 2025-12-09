import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoriaService } from '../../../services/categoria.service';
import { Categoria, PaginationParams } from '../../../interfaces';
import { finalize } from 'rxjs/operators';

// Import child components
import { CategoriasListComponent } from './categorias-list/categorias-list.component';
import { CategoriaFormComponent } from './categoria-form/categoria-form.component';
import { SearchBarComponent } from '../../../shared/components/search-bar/search-bar.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [
    CommonModule,
    CategoriasListComponent,
    CategoriaFormComponent,
    SearchBarComponent,
    PaginationComponent
  ],
  templateUrl: './categorias.component.html',
})
export class CategoriasComponent implements OnInit {
  categorias: Categoria[] = [];
  isLoading = false;
  isFormModalOpen = false;
  selectedCategoria: Categoria | null = null;
  errorMessage = '';
  successMessage = '';
  
  // Paginación
  currentPage: number = 1;
  lastPage: number = 1;
  total: number = 0;
  perPage: number = 15;
  searchTerm: string = '';

  constructor(
    private categoriaService: CategoriaService
  ) { }

  ngOnInit(): void {
    this.loadCategorias();
  }

  loadCategorias(): void {
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
    
    this.categoriaService.getPaginated(params)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          if (response.data) {
            this.categorias = response.data.data || [];
            this.currentPage = response.data.current_page;
            this.lastPage = response.data.last_page;
            this.total = response.data.total;
            this.perPage = response.data.per_page;
          }
        },
        error: (error) => {
          this.errorMessage = 'Error al cargar categorías';
          console.error('Error loading categorias', error);
          // Fallback a getAll si falla la paginación
          this.categoriaService.getAll()
            .pipe(finalize(() => this.isLoading = false))
            .subscribe({
              next: (response) => {
                this.categorias = response.data || [];
              }
            });
        }
      });
  }

  onSearch(search: string): void {
    this.searchTerm = search;
    this.currentPage = 1;
    this.loadCategorias();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadCategorias();
  }

  openFormModal(): void {
    this.selectedCategoria = null;
    this.isFormModalOpen = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  closeFormModal(): void {
    this.isFormModalOpen = false;
    this.selectedCategoria = null;
  }

  onEdit(categoria: Categoria): void {
    this.selectedCategoria = categoria;
    this.isFormModalOpen = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  onDelete(id: number): void {
    if (confirm('¿Estás seguro de eliminar esta categoría?')) {
      this.categoriaService.delete(id).subscribe({
        next: () => {
          this.successMessage = 'Categoría eliminada exitosamente';
          this.loadCategorias();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Error al eliminar la categoría';
          console.error('Error deleting categoria', error);
        }
      });
    }
  }

  onSave(categoriaData: Categoria): void {
    this.isLoading = true;
    const request = this.selectedCategoria && this.selectedCategoria.id
      ? this.categoriaService.update(this.selectedCategoria.id, categoriaData)
      : this.categoriaService.create(categoriaData);

    request
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          this.successMessage = `Categoría ${this.selectedCategoria ? 'actualizada' : 'creada'} exitosamente`;
          this.loadCategorias();
          this.closeFormModal();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Error al guardar la categoría';
          console.error('Error saving categoria', error);
        }
      });
  }
}
