import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClienteService } from '../../../services/cliente.service';
import { Cliente } from '../../../interfaces';
import { finalize } from 'rxjs/operators';

// Import child components
import { ClientesListComponent } from './clientes-list/clientes-list.component';
import { ClienteFormComponent } from './cliente-form/cliente-form.component';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [
    CommonModule,
    ClientesListComponent,
    ClienteFormComponent
  ],
  templateUrl: './clientes.component.html',
})
export class ClientesComponent implements OnInit {
  clientes: Cliente[] = [];
  isLoading = false;
  isFormModalOpen = false;
  selectedCliente: Cliente | null = null;

  constructor(
    private clienteService: ClienteService
  ) { }

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

  openFormModal(): void {
    this.selectedCliente = null;
    this.isFormModalOpen = true;
  }

  closeFormModal(): void {
    this.isFormModalOpen = false;
    this.selectedCliente = null;
  }

  onEdit(cliente: Cliente): void {
    this.selectedCliente = cliente;
    this.isFormModalOpen = true;
  }

  onDelete(id: number): void {
    if (confirm('¿Está seguro de eliminar este cliente?')) {
      this.clienteService.delete(id).subscribe({
        next: () => this.loadClientes(),
        error: (error) => console.error('Error deleting cliente', error)
      });
    }
  }

  onSave(clienteData: Cliente): void {
    this.isLoading = true;
    const request = this.selectedCliente && this.selectedCliente.id
      ? this.clienteService.update(this.selectedCliente.id, clienteData)
      : this.clienteService.create(clienteData);

    request
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          this.loadClientes();
          this.closeFormModal();
        },
        error: (error) => console.error('Error saving cliente', error)
      });
  }
}
