import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SucursalService } from '../../../services/sucursal.service';
import { EmpresaService } from '../../../services/empresa.service';
import { Sucursal, Empresa } from '../../../interfaces';
import { finalize } from 'rxjs/operators';

// Import child components
import { SucursalesListComponent } from './sucursales-list/sucursales-list.component';
import { SucursalFormComponent } from './sucursal-form/sucursal-form.component';

@Component({
  selector: 'app-sucursales',
  standalone: true,
  imports: [
    CommonModule,
    SucursalesListComponent,
    SucursalFormComponent
  ],
  templateUrl: './sucursales.component.html',
})
export class SucursalesComponent implements OnInit {
  sucursales: Sucursal[] = [];
  empresas: Empresa[] = [];
  isLoading = false;
  isFormModalOpen = false;
  selectedSucursal: Sucursal | null = null;

  constructor(
    private sucursalService: SucursalService,
    private empresaService: EmpresaService
  ) { }

  ngOnInit(): void {
    this.loadSucursales();
    this.loadEmpresas();
  }

  loadEmpresas(): void {
    this.empresaService.getAll().subscribe(res => this.empresas = res.data);
  }

  loadSucursales(): void {
    this.isLoading = true;
    this.sucursalService.getAll()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          this.sucursales = response.data;
        },
        error: (error) => console.error('Error loading sucursales', error)
      });
  }

  openFormModal(): void {
    this.selectedSucursal = null;
    this.isFormModalOpen = true;
  }

  closeFormModal(): void {
    this.isFormModalOpen = false;
    this.selectedSucursal = null;
  }

  onEdit(sucursal: Sucursal): void {
    this.selectedSucursal = sucursal;
    this.isFormModalOpen = true;
  }

  onDelete(id: number): void {
    if (confirm('¿Está seguro de eliminar esta sucursal?')) {
      this.sucursalService.delete(id).subscribe({
        next: () => this.loadSucursales(),
        error: (error) => console.error('Error deleting sucursal', error)
      });
    }
  }

  onSave(sucursalData: Sucursal): void {
    this.isLoading = true;
    const request = this.selectedSucursal && this.selectedSucursal.id
      ? this.sucursalService.update(this.selectedSucursal.id, sucursalData)
      : this.sucursalService.create(sucursalData);

    request
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          this.loadSucursales();
          this.closeFormModal();
        },
        error: (error) => console.error('Error saving sucursal', error)
      });
  }
}
