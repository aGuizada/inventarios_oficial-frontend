import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SucursalService } from '../../../services/sucursal.service';
import { EmpresaService } from '../../../services/empresa.service';
import { Sucursal, Empresa } from '../../../interfaces';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-sucursales',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './sucursales.component.html',
})
export class SucursalesComponent implements OnInit {
  sucursales: Sucursal[] = [];
  empresas: Empresa[] = [];
  form: FormGroup;
  isModalOpen = false;
  isEditing = false;
  isLoading = false;
  currentId: number | null = null;

  constructor(
    private sucursalService: SucursalService,
    private empresaService: EmpresaService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      empresa_id: ['', Validators.required],
      nombre: ['', Validators.required],
      codigoSucursal: [''],
      direccion: [''],
      correo: ['', [Validators.email]],
      telefono: [''],
      departamento: [''],
      responsable: [''],
      estado: [true]
    });
  }

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

  openModal(): void {
    this.isModalOpen = true;
    this.isEditing = false;
    this.currentId = null;
    this.form.reset({ estado: true });
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.form.reset();
  }

  edit(sucursal: Sucursal): void {
    this.isModalOpen = true;
    this.isEditing = true;
    this.currentId = sucursal.id;
    this.form.patchValue({
      empresa_id: sucursal.empresa_id,
      nombre: sucursal.nombre,
      codigoSucursal: sucursal.codigoSucursal,
      direccion: sucursal.direccion,
      correo: sucursal.correo,
      telefono: sucursal.telefono,
      departamento: sucursal.departamento,
      responsable: sucursal.responsable,
      estado: sucursal.estado
    });
  }

  save(): void {
    if (this.form.invalid) return;

    const sucursalData = this.form.value;

    if (this.isEditing && this.currentId) {
      this.sucursalService.update(this.currentId, sucursalData).subscribe({
        next: () => {
          this.loadSucursales();
          this.closeModal();
        },
        error: (error) => console.error('Error updating sucursal', error)
      });
    } else {
      this.sucursalService.create(sucursalData).subscribe({
        next: () => {
          this.loadSucursales();
          this.closeModal();
        },
        error: (error) => console.error('Error creating sucursal', error)
      });
    }
  }

  delete(id: number): void {
    if (confirm('¿Está seguro de eliminar esta sucursal?')) {
      this.sucursalService.delete(id).subscribe({
        next: () => this.loadSucursales(),
        error: (error) => console.error('Error deleting sucursal', error)
      });
    }
  }
}
