import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmpresaService } from '../../../services/empresa.service';
import { Empresa } from '../../../interfaces';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-empresas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './empresas.component.html',
})
export class EmpresasComponent implements OnInit {
  empresas: Empresa[] = [];
  form: FormGroup;
  isModalOpen = false;
  isEditing = false;
  isLoading = false;
  currentId: number | null = null;

  constructor(
    private empresaService: EmpresaService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      nit: [''],
      direccion: [''],
      telefono: [''],
      email: ['', [Validators.email]],
      logo: ['']
    });
  }

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

  openModal(): void {
    this.isModalOpen = true;
    this.isEditing = false;
    this.currentId = null;
    this.form.reset();
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.form.reset();
  }

  edit(empresa: Empresa): void {
    this.isModalOpen = true;
    this.isEditing = true;
    this.currentId = empresa.id;
    this.form.patchValue({
      nombre: empresa.nombre,
      nit: empresa.nit,
      direccion: empresa.direccion,
      telefono: empresa.telefono,
      email: empresa.email,
      logo: empresa.logo
    });
  }

  save(): void {
    if (this.form.invalid) return;

    const empresaData = this.form.value;

    if (this.isEditing && this.currentId) {
      this.empresaService.update(this.currentId, empresaData).subscribe({
        next: () => {
          this.loadEmpresas();
          this.closeModal();
        },
        error: (error) => console.error('Error updating empresa', error)
      });
    } else {
      this.empresaService.create(empresaData).subscribe({
        next: () => {
          this.loadEmpresas();
          this.closeModal();
        },
        error: (error) => console.error('Error creating empresa', error)
      });
    }
  }

  delete(id: number): void {
    if (confirm('¿Está seguro de eliminar esta empresa?')) {
      this.empresaService.delete(id).subscribe({
        next: () => this.loadEmpresas(),
        error: (error) => console.error('Error deleting empresa', error)
      });
    }
  }
}
