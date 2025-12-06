import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IndustriaService } from '../../../services/industria.service';
import { Industria } from '../../../interfaces';
import { finalize } from 'rxjs/operators';

// Import child components
import { IndustriasListComponent } from './industrias-list/industrias-list.component';
import { IndustriaFormComponent } from './industria-form/industria-form.component';

@Component({
  selector: 'app-industrias',
  standalone: true,
  imports: [
    CommonModule,
    IndustriasListComponent,
    IndustriaFormComponent
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

  constructor(
    private industriaService: IndustriaService
  ) { }

  ngOnInit(): void {
    this.loadIndustrias();
  }

  loadIndustrias(): void {
    this.isLoading = true;
    this.industriaService.getAll()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          this.industrias = response.data;
        },
        error: (error) => {
          this.errorMessage = 'Error al cargar industrias';
          console.error('Error loading industrias', error);
        }
      });
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
