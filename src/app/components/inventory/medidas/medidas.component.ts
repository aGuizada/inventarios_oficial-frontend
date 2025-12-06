import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MedidaService } from '../../../services/medida.service';
import { Medida } from '../../../interfaces';

@Component({
  selector: 'app-medidas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './medidas.component.html',
})
export class MedidasComponent implements OnInit {
  medidas: Medida[] = [];
  medidaForm: FormGroup;
  isLoading = false;
  isModalOpen = false;
  isEditMode = false;
  selectedMedidaId: number | null = null;
  errorMessage = '';
  successMessage = '';

  constructor(
    private medidaService: MedidaService,
    private fb: FormBuilder
  ) {
    this.medidaForm = this.fb.group({
      nombre_medida: ['', [Validators.required, Validators.minLength(2)]],
      abreviatura: ['', [Validators.maxLength(10)]]
    });
  }

  ngOnInit(): void {
    this.loadMedidas();
  }

  loadMedidas(): void {
    this.isLoading = true;
    this.medidaService.getAll().subscribe({
      next: (response) => {
        this.medidas = response.data;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Error al cargar medidas';
        this.isLoading = false;
      }
    });
  }

  openModal(medida?: Medida): void {
    this.isModalOpen = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (medida) {
      this.isEditMode = true;
      this.selectedMedidaId = medida.id;
      this.medidaForm.patchValue({
        nombre_medida: medida.nombre_medida,
        abreviatura: medida.abreviatura
      });
    } else {
      this.isEditMode = false;
      this.selectedMedidaId = null;
      this.medidaForm.reset();
    }
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.medidaForm.reset();
    this.isEditMode = false;
    this.selectedMedidaId = null;
  }

  onSubmit(): void {
    if (this.medidaForm.invalid) {
      this.medidaForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const medidaData = this.medidaForm.value;

    const request = this.isEditMode && this.selectedMedidaId
      ? this.medidaService.update(this.selectedMedidaId, medidaData)
      : this.medidaService.create(medidaData);

    request.subscribe({
      next: () => {
        this.successMessage = `Medida ${this.isEditMode ? 'actualizada' : 'creada'} exitosamente`;
        this.loadMedidas();
        this.closeModal();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Error al guardar la medida';
        this.isLoading = false;
      }
    });
  }

  deleteMedida(id: number): void {
    if (confirm('¿Estás seguro de eliminar esta medida?')) {
      this.medidaService.delete(id).subscribe({
        next: () => {
          this.successMessage = 'Medida eliminada exitosamente';
          this.loadMedidas();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Error al eliminar la medida';
        }
      });
    }
  }
}
