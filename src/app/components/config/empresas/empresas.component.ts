import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmpresaService } from '../../../services/empresa.service';
import { Empresa } from '../../../interfaces';
import { finalize } from 'rxjs/operators';

// Import child components
import { EmpresasListComponent } from './empresas-list/empresas-list.component';
import { EmpresaFormComponent } from './empresa-form/empresa-form.component';

@Component({
  selector: 'app-empresas',
  standalone: true,
  imports: [
    CommonModule,
    EmpresasListComponent,
    EmpresaFormComponent
  ],
  templateUrl: './empresas.component.html',
})
export class EmpresasComponent implements OnInit {
  empresas: Empresa[] = [];
  isLoading = false;
  isFormModalOpen = false;
  selectedEmpresa: Empresa | null = null;

  constructor(
    private empresaService: EmpresaService
  ) { }

  ngOnInit(): void {
    this.loadEmpresas();
  }

  loadEmpresas(): void {
    this.isLoading = true;
    this.empresaService.getAll()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          this.empresas = response.data;
        },
        error: (error) => console.error('Error loading empresas', error)
      });
  }

  openFormModal(): void {
    this.selectedEmpresa = null;
    this.isFormModalOpen = true;
  }

  closeFormModal(): void {
    this.isFormModalOpen = false;
    this.selectedEmpresa = null;
  }

  onEdit(empresa: Empresa): void {
    this.selectedEmpresa = empresa;
    this.isFormModalOpen = true;
  }

  onDelete(id: number): void {
    if (confirm('¿Está seguro de eliminar esta empresa?')) {
      this.empresaService.delete(id).subscribe({
        next: () => this.loadEmpresas(),
        error: (error) => console.error('Error deleting empresa', error)
      });
    }
  }

  onSave(empresaData: Empresa): void {
    this.isLoading = true;
    const request = this.selectedEmpresa && this.selectedEmpresa.id
      ? this.empresaService.update(this.selectedEmpresa.id, empresaData)
      : this.empresaService.create(empresaData);

    request
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          this.loadEmpresas();
          this.closeFormModal();
        },
        error: (error) => console.error('Error saving empresa', error)
      });
  }
}
