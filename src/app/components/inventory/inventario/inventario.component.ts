import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventarioService } from '../../../services/inventario.service';
import { AlmacenService } from '../../../services/almacen.service';
import { Inventario, Almacen, ApiResponse } from '../../../interfaces';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventario.component.html',
  styleUrl: './inventario.component.css'
})
export class InventarioComponent implements OnInit {
  inventarios: Inventario[] = [];
  inventariosFiltrados: Inventario[] = [];
  almacenes: Almacen[] = [];
  almacenSeleccionado: number | null = null;
  isLoading = false;
  busqueda: string = '';

  constructor(
    private inventarioService: InventarioService,
    private almacenService: AlmacenService
  ) {}

  ngOnInit(): void {
    this.loadAlmacenes();
    this.loadInventarios();
  }

  loadAlmacenes(): void {
    this.almacenService.getAll().subscribe({
      next: (response: ApiResponse<Almacen[]> | { data: Almacen[] }) => {
        // El backend devuelve { data: [...] }
        if ('data' in response) {
          this.almacenes = response.data || [];
        } else if (Array.isArray(response)) {
          this.almacenes = response;
        } else {
          this.almacenes = [];
        }
      },
      error: (error) => {
        console.error('Error al cargar almacenes:', error);
        this.almacenes = [];
      }
    });
  }

  loadInventarios(): void {
    this.isLoading = true;
    this.inventarioService.getAll()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (inventarios) => {
          this.inventarios = inventarios;
          this.aplicarFiltros();
        },
        error: (error) => {
          console.error('Error al cargar inventarios:', error);
          alert('Error al cargar el inventario. Por favor, intente nuevamente.');
        }
      });
  }

  filtrarPorAlmacen(almacenId: any): void {
    // Convertir a número si viene como string del select
    if (almacenId === null || almacenId === '' || almacenId === 'null') {
      this.almacenSeleccionado = null;
    } else {
      this.almacenSeleccionado = typeof almacenId === 'string' ? parseInt(almacenId, 10) : Number(almacenId);
    }
    console.log('Almacén seleccionado:', this.almacenSeleccionado, 'Tipo:', typeof this.almacenSeleccionado);
    this.aplicarFiltros();
  }

  buscar(): void {
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    let filtrados = [...this.inventarios];
    console.log('Inventarios totales:', filtrados.length);
    console.log('Almacén seleccionado para filtrar:', this.almacenSeleccionado);

    // Filtrar por almacén
    if (this.almacenSeleccionado !== null && this.almacenSeleccionado !== undefined) {
      const almacenIdNum = Number(this.almacenSeleccionado);
      filtrados = filtrados.filter(inv => {
        const invAlmacenId = Number(inv.almacen_id);
        const coincide = invAlmacenId === almacenIdNum;
        if (!coincide && inv.almacen_id) {
          console.log(`Inventario ${inv.id}: almacen_id=${inv.almacen_id} (${typeof inv.almacen_id}) no coincide con ${almacenIdNum} (${typeof almacenIdNum})`);
        }
        return coincide;
      });
      console.log('Inventarios filtrados por almacén:', filtrados.length);
    }

    // Filtrar por búsqueda (nombre de artículo o código)
    if (this.busqueda.trim()) {
      const busquedaLower = this.busqueda.toLowerCase().trim();
      filtrados = filtrados.filter(inv => {
        const nombre = inv.articulo?.nombre?.toLowerCase() || '';
        const codigo = inv.articulo?.codigo?.toLowerCase() || '';
        return nombre.includes(busquedaLower) || codigo.includes(busquedaLower);
      });
    }

    this.inventariosFiltrados = filtrados;
  }

  limpiarFiltros(): void {
    this.almacenSeleccionado = null;
    this.busqueda = '';
    this.aplicarFiltros();
  }

  getTotalCantidad(): number {
    return this.inventariosFiltrados.reduce((sum, inv) => sum + inv.cantidad, 0);
  }

  getTotalSaldoStock(): number {
    return this.inventariosFiltrados.reduce((sum, inv) => sum + inv.saldo_stock, 0);
  }

  getNombreAlmacen(almacenId: number): string {
    const almacen = this.almacenes.find(a => a.id === almacenId);
    return almacen?.nombre_almacen || 'N/A';
  }
}
