import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProveedorService } from '../../../services/proveedor.service';
import { Proveedor } from '../../../interfaces';
import { finalize } from 'rxjs/operators';

// Import child components
import { ProveedoresListComponent } from './proveedores-list/proveedores-list.component';
import { ProveedorFormComponent } from './proveedor-form/proveedor-form.component';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [
    CommonModule,
    ProveedoresListComponent,
    ProveedorFormComponent
  ],
  templateUrl: './proveedores.component.html',
})
export class ProveedoresComponent implements OnInit {
  proveedores: Proveedor[] = [];
  isLoading = false;
  isFormModalOpen = false;
  selectedProveedor: Proveedor | null = null;

  constructor(
    private proveedorService: ProveedorService
  ) { }

  ngOnInit(): void {
    this.loadProveedores();
  }

  loadProveedores(): void {
    this.isLoading = true;
    this.proveedorService.getAll()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          this.proveedores = response.data;
        },
        error: (error) => console.error('Error loading proveedores', error)
      });
  }

  openFormModal(): void {
    this.selectedProveedor = null;
    this.isFormModalOpen = true;
  }

  closeFormModal(): void {
    this.isFormModalOpen = false;
    this.selectedProveedor = null;
  }

  onEdit(proveedor: Proveedor): void {
    this.selectedProveedor = proveedor;
    this.isFormModalOpen = true;
  }

  onDelete(id: number): void {
    if (confirm('¿Está seguro de eliminar este proveedor?')) {
      this.proveedorService.delete(id).subscribe({
        next: () => this.loadProveedores(),
        error: (error) => console.error('Error deleting proveedor', error)
      });
    }
  }

  onSave(proveedorData: Proveedor): void {
    this.isLoading = true;
    const request = this.selectedProveedor && this.selectedProveedor.id
      ? this.proveedorService.update(this.selectedProveedor.id, proveedorData)
      : this.proveedorService.create(proveedorData);

    request
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          this.loadProveedores();
          this.closeFormModal();
        },
        error: (error) => console.error('Error saving proveedor', error)
      });
  }
}
