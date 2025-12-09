import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClienteService } from '../../../services/cliente.service';
import { Cliente, PaginationParams } from '../../../interfaces';
import { finalize } from 'rxjs/operators';

// Import child components
import { ClientesListComponent } from './clientes-list/clientes-list.component';
import { ClienteFormComponent } from './cliente-form/cliente-form.component';
import { SearchBarComponent } from '../../../shared/components/search-bar/search-bar.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [
    CommonModule,
    ClientesListComponent,
    ClienteFormComponent,
    SearchBarComponent,
    PaginationComponent
  ],
  templateUrl: './clientes.component.html',
})
export class ClientesComponent implements OnInit {
  clientes: Cliente[] = [];
  isLoading = false;
  isFormModalOpen = false;
  selectedCliente: Cliente | null = null;
  
  // Paginación
  currentPage: number = 1;
  lastPage: number = 1;
  total: number = 0;
  perPage: number = 15;
  searchTerm: string = '';

  constructor(
    private clienteService: ClienteService
  ) { }

  ngOnInit(): void {
    this.loadClientes();
  }

  loadClientes(): void {
    this.isLoading = true;
    
    const params: PaginationParams = {
      page: this.currentPage,
      per_page: this.perPage,
      sort_by: 'id',
      sort_order: 'desc'
    };
    
    if (this.searchTerm) {
      params.search = this.searchTerm;
    }
    
    this.clienteService.getPaginated(params)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          if (response.data) {
            this.clientes = response.data.data || [];
            this.currentPage = response.data.current_page;
            this.lastPage = response.data.last_page;
            this.total = response.data.total;
            this.perPage = response.data.per_page;
          }
        },
        error: (error) => {
          console.error('Error loading clientes', error);
          // Fallback a getAll si falla la paginación
          this.clienteService.getAll()
            .pipe(finalize(() => this.isLoading = false))
            .subscribe({
              next: (response) => {
                this.clientes = response.data || [];
              }
            });
        }
      });
  }

  onSearch(search: string): void {
    this.searchTerm = search;
    this.currentPage = 1;
    this.loadClientes();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadClientes();
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
