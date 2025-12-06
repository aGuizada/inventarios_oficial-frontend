import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CategoriaService } from '../../../services/categoria.service';
import { Categoria } from '../../../interfaces';

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './categorias.component.html',
})
export class CategoriasComponent implements OnInit {
  categorias: Categoria[] = [];
  categoriaForm: FormGroup;
  isLoading = false;
  isModalOpen = false;
  isEditMode = false;
  selectedCategoriaId: number | null = null;
  errorMessage = '';
  successMessage = '';

  constructor(
    private categoriaService: CategoriaService,
    private fb: FormBuilder
  ) {
    this.categoriaForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: ['']
    });
  }

  ngOnInit(): void {
    this.loadCategorias();
  }

  loadCategorias(): void {
    this.isLoading = true;
    this.categoriaService.getAll().subscribe({
      next: (response) => {
        this.categorias = response.data;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Error al cargar categorías';
        this.isLoading = false;
      }
    });
  }

  openModal(categoria?: Categoria): void {
    this.isModalOpen = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (categoria) {
      this.isEditMode = true;
      this.selectedCategoriaId = categoria.id;
      this.categoriaForm.patchValue({
        nombre: categoria.nombre,
        descripcion: categoria.descripcion
      });
    } else {
      this.isEditMode = false;
      this.selectedCategoriaId = null;
      this.categoriaForm.reset();
    }
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.categoriaForm.reset();
    this.isEditMode = false;
    this.selectedCategoriaId = null;
  }

  onSubmit(): void {
    if (this.categoriaForm.invalid) {
      this.categoriaForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const categoriaData = this.categoriaForm.value;

    const request = this.isEditMode && this.selectedCategoriaId
      ? this.categoriaService.update(this.selectedCategoriaId, categoriaData)
      : this.categoriaService.create(categoriaData);

    request.subscribe({
      next: () => {
        this.successMessage = `Categoría ${this.isEditMode ? 'actualizada' : 'creada'} exitosamente`;
        this.loadCategorias();
        this.closeModal();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Error al guardar la categoría';
        this.isLoading = false;
      }
    });
  }

  deleteCategoria(id: number): void {
    if (confirm('¿Estás seguro de eliminar esta categoría?')) {
      this.categoriaService.delete(id).subscribe({
        next: () => {
          this.successMessage = 'Categoría eliminada exitosamente';
          this.loadCategorias();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Error al eliminar la categoría';
        }
      });
    }
  }
}
