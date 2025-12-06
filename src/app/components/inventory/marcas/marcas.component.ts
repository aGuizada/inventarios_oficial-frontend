import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MarcaService } from '../../../services/marca.service';
import { Marca } from '../../../interfaces';

@Component({
  selector: 'app-marcas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './marcas.component.html',
})
export class MarcasComponent implements OnInit {
  marcas: Marca[] = [];
  marcaForm: FormGroup;
  isLoading = false;
  isModalOpen = false;
  isEditMode = false;
  selectedMarcaId: number | null = null;
  errorMessage = '';
  successMessage = '';

  constructor(
    private marcaService: MarcaService,
    private fb: FormBuilder
  ) {
    this.marcaForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      descripcion: ['']
    });
  }

  ngOnInit(): void {
    this.loadMarcas();
  }

  loadMarcas(): void {
    this.isLoading = true;
    this.marcaService.getAll().subscribe({
      next: (response) => {
        this.marcas = response.data;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Error al cargar marcas';
        this.isLoading = false;
      }
    });
  }

  openModal(marca?: Marca): void {
    this.isModalOpen = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (marca) {
      this.isEditMode = true;
      this.selectedMarcaId = marca.id;
      this.marcaForm.patchValue({
        nombre: marca.nombre,
        descripcion: marca.descripcion
      });
    } else {
      this.isEditMode = false;
      this.selectedMarcaId = null;
      this.marcaForm.reset();
    }
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.marcaForm.reset();
    this.isEditMode = false;
    this.selectedMarcaId = null;
  }

  onSubmit(): void {
    if (this.marcaForm.invalid) {
      this.marcaForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const marcaData = this.marcaForm.value;

    const request = this.isEditMode && this.selectedMarcaId
      ? this.marcaService.update(this.selectedMarcaId, marcaData)
      : this.marcaService.create(marcaData);

    request.subscribe({
      next: () => {
        this.successMessage = `Marca ${this.isEditMode ? 'actualizada' : 'creada'} exitosamente`;
        this.loadMarcas();
        this.closeModal();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Error al guardar la marca';
        this.isLoading = false;
      }
    });
  }

  deleteMarca(id: number): void {
    if (confirm('¿Estás seguro de eliminar esta marca?')) {
      this.marcaService.delete(id).subscribe({
        next: () => {
          this.successMessage = 'Marca eliminada exitosamente';
          this.loadMarcas();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Error al eliminar la marca';
        }
      });
    }
  }
}
