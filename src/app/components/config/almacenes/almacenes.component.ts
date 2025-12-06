import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlmacenService } from '../../../services/almacen.service';
import { SucursalService } from '../../../services/sucursal.service';
import { Almacen, Sucursal } from '../../../interfaces';
import { finalize } from 'rxjs/operators';

// Import child components
import { AlmacenesListComponent } from './almacenes-list/almacenes-list.component';
import { AlmacenFormComponent } from './almacen-form/almacen-form.component';

@Component({
  selector: 'app-almacenes',
  standalone: true,
  imports: [
    CommonModule,
    AlmacenesListComponent,
    AlmacenFormComponent
  ],
  templateUrl: './almacenes.component.html',
})
export class AlmacenesComponent implements OnInit {
  almacenes: Almacen[] = [];
  sucursales: Sucursal[] = [];
  isLoading = false;
  isFormModalOpen = false;
  selectedAlmacen: Almacen | null = null;

  constructor(
    private almacenService: AlmacenService,
    private sucursalService: SucursalService
  ) { }

  ngOnInit(): void {
    this.loadAlmacenes();
    this.loadSucursales();
  }

  loadAlmacenes(): void {
    this.isLoading = true;
    this.almacenService.getAll()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          this.almacenes = response.data;
        },
        error: (error) => console.error('Error loading almacenes', error)
      });
  }

  loadSucursales(): void {
    this.sucursalService.getAll().subscribe({
      next: (response) => {
        this.sucursales = response.data;
      },
      error: (error) => console.error('Error loading sucursales', error)
    });
  }

  openFormModal(): void {
    this.selectedAlmacen = null;
    this.isFormModalOpen = true;
  }

  closeFormModal(): void {
    this.isFormModalOpen = false;
    this.selectedAlmacen = null;
  }

  onEdit(almacen: Almacen): void {
    this.selectedAlmacen = almacen;
    this.isFormModalOpen = true;
  }

  onDelete(id: number): void {
    if (confirm('¿Está seguro de eliminar este almacén?')) {
      this.almacenService.delete(id).subscribe({
        next: () => this.loadAlmacenes(),
        error: (error) => console.error('Error deleting almacen', error)
      });
    }
  }

  onSave(almacenData: Almacen): void {
    this.isLoading = true;
    const request = this.selectedAlmacen && this.selectedAlmacen.id
      ? this.almacenService.update(this.selectedAlmacen.id, almacenData)
      : this.almacenService.create(almacenData);

    request
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          this.loadAlmacenes();
          this.closeFormModal();
        },
        error: (error) => console.error('Error saving almacen', error)
      });
  }
}
