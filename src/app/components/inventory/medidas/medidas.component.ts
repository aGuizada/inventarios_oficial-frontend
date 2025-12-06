import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MedidaService } from '../../../services/medida.service';
import { Medida } from '../../../interfaces';
import { finalize } from 'rxjs/operators';

// Import child components
import { MedidasListComponent } from './medidas-list/medidas-list.component';
import { MedidaFormComponent } from './medida-form/medida-form.component';

@Component({
  selector: 'app-medidas',
  standalone: true,
  imports: [
    CommonModule,
    MedidasListComponent,
    MedidaFormComponent
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

  constructor(
    private medidaService: MedidaService
  ) { }

  ngOnInit(): void {
    this.loadMedidas();
  }

  loadMedidas(): void {
    this.isLoading = true;
    this.medidaService.getAll()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          this.medidas = response.data;
        },
        error: (error) => {
          this.errorMessage = 'Error al cargar medidas';
          console.error('Error loading medidas', error);
        }
      });
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
