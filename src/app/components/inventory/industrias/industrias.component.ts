import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IndustriaService } from '../../../services/industria.service';
import { Industria } from '../../../interfaces';

@Component({
  selector: 'app-industrias',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './industrias.component.html',
  styleUrls: ['./industrias.component.css']
})
export class IndustriasComponent implements OnInit {
  industrias: Industria[] = [];
  industriaForm: FormGroup;
  isLoading = false;
  isModalOpen = false;
  isEditMode = false;
  selectedIndustriaId: number | null = null;
  errorMessage = '';
  successMessage = '';

  constructor(
    private industriaService: IndustriaService,
    private fb: FormBuilder
  ) {
    this.industriaForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: ['']
    });
  }

  ngOnInit(): void {
    this.loadIndustrias();
  }

  loadIndustrias(): void {
    this.isLoading = true;
    this.industriaService.getAll().subscribe({
      next: (response) => {
        this.industrias = response.data;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Error al cargar industrias';
        this.isLoading = false;
      }
    });
  }

  openModal(industria?: Industria): void {
    this.isModalOpen = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (industria) {
      this.isEditMode = true;
      this.selectedIndustriaId = industria.id;
      this.industriaForm.patchValue({
        nombre: industria.nombre,
        descripcion: industria.descripcion
      });
    } else {
      this.isEditMode = false;
      this.selectedIndustriaId = null;
      this.industriaForm.reset();
    }
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.industriaForm.reset();
    this.isEditMode = false;
    this.selectedIndustriaId = null;
  }

  onSubmit(): void {
    if (this.industriaForm.invalid) {
      this.industriaForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const industriaData = this.industriaForm.value;

    const request = this.isEditMode && this.selectedIndustriaId
      ? this.industriaService.update(this.selectedIndustriaId, industriaData)
      : this.industriaService.create(industriaData);

    request.subscribe({
      next: () => {
        this.successMessage = `Industria ${this.isEditMode ? 'actualizada' : 'creada'} exitosamente`;
        this.loadIndustrias();
        this.closeModal();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Error al guardar la industria';
        this.isLoading = false;
      }
    });
  }

  deleteIndustria(id: number): void {
    if (confirm('¿Estás seguro de eliminar esta industria?')) {
      this.industriaService.delete(id).subscribe({
        next: () => {
          this.successMessage = 'Industria eliminada exitosamente';
          this.loadIndustrias();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Error al eliminar la industria';
        }
      });
    }
  }
}
