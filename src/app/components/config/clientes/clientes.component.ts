import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClienteService } from '../../../services/cliente.service';
import { Cliente } from '../../../interfaces';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.css'
})
export class ClientesComponent implements OnInit {
  clientes: Cliente[] = [];
  form: FormGroup;
  isModalOpen = false;
  isEditing = false;
  isLoading = false;
  currentId: number | null = null;

  constructor(
    private clienteService: ClienteService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      tipo_documento: [''],
      num_documento: [''],
      telefono: [''],
      email: ['', [Validators.email]],
      direccion: [''],
      estado: [true]
    });
  }

  ngOnInit(): void {
    this.loadClientes();
  }

  loadClientes(): void {
    this.isLoading = true;
    this.clienteService.getAll()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          this.clientes = response.data;
        },
        error: (error) => console.error('Error loading clientes', error)
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

  edit(cliente: Cliente): void {
    this.isModalOpen = true;
    this.isEditing = true;
    this.currentId = cliente.id;
    this.form.patchValue({
      nombre: cliente.nombre,
      tipo_documento: cliente.tipo_documento,
      num_documento: cliente.num_documento,
      telefono: cliente.telefono,
      email: cliente.email,
      direccion: cliente.direccion,
      estado: cliente.estado
    });
  }

  save(): void {
    if (this.form.invalid) return;

    const clienteData = this.form.value;

    if (this.isEditing && this.currentId) {
      this.clienteService.update(this.currentId, clienteData).subscribe({
        next: () => {
          this.loadClientes();
          this.closeModal();
        },
        error: (error) => console.error('Error updating cliente', error)
      });
    } else {
      this.clienteService.create(clienteData).subscribe({
        next: () => {
          this.loadClientes();
          this.closeModal();
        },
        error: (error) => console.error('Error creating cliente', error)
      });
    }
  }

  delete(id: number): void {
    if (confirm('¿Está seguro de eliminar este cliente?')) {
      this.clienteService.delete(id).subscribe({
        next: () => this.loadClientes(),
        error: (error) => console.error('Error deleting cliente', error)
      });
    }
  }
}
