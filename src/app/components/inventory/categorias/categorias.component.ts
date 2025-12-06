import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoriaService } from '../../../services/categoria.service';
import { Categoria } from '../../../interfaces';
import { finalize } from 'rxjs/operators';

// Import child components
import { CategoriasListComponent } from './categorias-list/categorias-list.component';
import { CategoriaFormComponent } from './categoria-form/categoria-form.component';

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [
    CommonModule,
    CategoriasListComponent,
    CategoriaFormComponent
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

  constructor(
    private categoriaService: CategoriaService
  ) { }

  ngOnInit(): void {
    this.loadCategorias();
  }

  loadCategorias(): void {
    this.isLoading = true;
    this.categoriaService.getAll()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          this.categorias = response.data;
        },
        error: (error) => {
          this.errorMessage = 'Error al cargar categorías';
          console.error('Error loading categorias', error);
        }
      });
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
