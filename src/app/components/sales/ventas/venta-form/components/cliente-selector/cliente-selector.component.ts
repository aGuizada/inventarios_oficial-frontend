import { Component, Input, OnInit, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Cliente } from '../../../../../../interfaces';
import { ClienteFormComponent } from '../../../../../config/clientes/cliente-form/cliente-form.component';
import { ClienteService } from '../../../../../../services/cliente.service';

@Component({
    selector: 'app-cliente-selector',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule, ClienteFormComponent],
    templateUrl: './cliente-selector.component.html',
})
export class ClienteSelectorComponent implements OnInit, OnChanges {
    @Input() parentForm!: FormGroup;
    @Input() clientes: Cliente[] = [];
    @Output() clienteCreado = new EventEmitter<Cliente>();

    clienteBusqueda: string = '';
    clientesFiltrados: Cliente[] = [];
    mostrarSugerenciasCliente: boolean = false;
    clienteSeleccionado: Cliente | null = null;
    isModalOpen: boolean = false;

    constructor(private clienteService: ClienteService) { }

    ngOnInit(): void {
        this.checkInitialSelection();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['clientes'] && this.clientes.length > 0) {
            this.checkInitialSelection();
        }
    }

    private checkInitialSelection(): void {
        // Si el formulario ya tiene un valor, intentar buscar el cliente para mostrar el nombre
        const clienteId = this.parentForm.get('cliente_id')?.value;
        if (clienteId && this.clientes.length > 0 && !this.clienteSeleccionado) {
            const cliente = this.clientes.find(c => c.id === clienteId);
            if (cliente) {
                this.seleccionarCliente(cliente);
            }
        }
    }

    buscarCliente(event: any): void {
        const valor = event.target.value.toLowerCase().trim();
        this.clienteBusqueda = valor;

        if (valor.length > 0) {
            this.clientesFiltrados = this.clientes.filter(cliente =>
                cliente.nombre?.toLowerCase().includes(valor) ||
                cliente.num_documento?.toLowerCase().includes(valor)
            );
            this.mostrarSugerenciasCliente = this.clientesFiltrados.length > 0;
        } else {
            this.clientesFiltrados = [];
            this.mostrarSugerenciasCliente = false;
        }
    }

    seleccionarCliente(cliente: Cliente): void {
        this.clienteSeleccionado = cliente;
        this.clienteBusqueda = cliente.nombre || '';
        this.parentForm.patchValue({ cliente_id: cliente.id });
        this.mostrarSugerenciasCliente = false;
    }

    limpiarCliente(): void {
        this.clienteSeleccionado = null;
        this.clienteBusqueda = '';
        this.parentForm.patchValue({ cliente_id: '' });
    }

    onFocusCliente(): void {
        if (this.clienteBusqueda.length > 0) {
            this.buscarCliente({ target: { value: this.clienteBusqueda } });
        }
    }

    onBlurCliente(): void {
        setTimeout(() => {
            this.mostrarSugerenciasCliente = false;
        }, 200);
    }

    abrirModalNuevoCliente(): void {
        this.isModalOpen = true;
    }

    cerrarModalNuevoCliente(): void {
        this.isModalOpen = false;
    }

    guardarNuevoCliente(clienteData: Cliente): void {
        this.clienteService.create(clienteData).subscribe({
            next: (response: any) => {
                const nuevoCliente = response.data || response;
                // Agregamos a la lista local
                this.clientes.push(nuevoCliente);
                // Emitimos evento para que el padre también actualice si es necesario
                this.clienteCreado.emit(nuevoCliente);
                // Seleccionamos el nuevo cliente
                this.seleccionarCliente(nuevoCliente);
                this.cerrarModalNuevoCliente();
            },
            error: (error) => {
                console.error('Error al crear cliente:', error);
                alert('Error al crear el cliente');
            }
        });
    }
}
