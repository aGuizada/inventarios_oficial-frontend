import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { ReporteService } from '../../../services/reporte.service';
import { SucursalService } from '../../../services/sucursal.service';
import { MonedaPipe } from '../../../pipes/moneda.pipe';

interface UtilidadSucursal {
  sucursal_id: number;
  sucursal_nombre: string;
  total_ventas: number;
  total_compras: number;
  utilidad: number;
  margen_porcentaje: number;
  cantidad_ventas: number;
  cantidad_compras: number;
}

@Component({
  selector: 'app-utilidades-sucursal',
  standalone: true,
  imports: [CommonModule, FormsModule, MonedaPipe, NgClass],
  templateUrl: './utilidades-sucursal.component.html'
})
export class UtilidadesSucursalComponent implements OnInit {
  isLoading: boolean = false;
  utilidades: UtilidadSucursal[] = [];
  fechaDesde: string = '';
  fechaHasta: string = '';
  sucursalSeleccionada: number | null = null;
  sucursales: any[] = [];
  totalGeneral: {
    total_ventas: number;
    total_compras: number;
    utilidad_total: number;
    margen_promedio: number;
  } = {
    total_ventas: 0,
    total_compras: 0,
    utilidad_total: 0,
    margen_promedio: 0
  };

  constructor(
    private reporteService: ReporteService,
    private sucursalService: SucursalService
  ) {
    // Fechas por defecto: último mes
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hoy.getDate() - 30);

    this.fechaHasta = hoy.toISOString().split('T')[0];
    this.fechaDesde = hace30Dias.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.cargarSucursales();
    this.cargarUtilidades();
  }

  cargarSucursales(): void {
    this.sucursalService.getAll().subscribe({
      next: (response: any) => {
        try {
          if (Array.isArray(response)) {
            this.sucursales = response;
          } else if (response?.success && response?.data) {
            if (Array.isArray(response.data)) {
              this.sucursales = response.data;
            } else if (response.data?.data && Array.isArray(response.data.data)) {
              this.sucursales = response.data.data;
            } else {
              this.sucursales = [];
            }
          } else if (response?.data && Array.isArray(response.data)) {
            this.sucursales = response.data;
          } else {
            this.sucursales = [];
          }
        } catch (e) {
          console.error('Error procesando respuesta de sucursales:', e);
          this.sucursales = [];
        }
      },
      error: (error) => {
        console.error('Error cargando sucursales:', error);
        this.sucursales = [];
      }
    });
  }

  onSucursalChange(value: any): void {
    // Manejar diferentes tipos de valores que pueden llegar
    if (value === null || value === undefined || value === '' || value === 'null' || value === 0) {
      this.sucursalSeleccionada = null;
    } else {
      // Convertir a número si es necesario
      const numValue = Number(value);
      this.sucursalSeleccionada = isNaN(numValue) ? null : numValue;
    }
    this.cargarUtilidades();
  }

  cargarUtilidades(): void {
    if (!this.fechaDesde || !this.fechaHasta) {
      return;
    }

    this.isLoading = true;
    const params: any = {
      fecha_desde: this.fechaDesde,
      fecha_hasta: this.fechaHasta
    };
    
    // Solo agregar sucursal_id si hay una sucursal seleccionada válida
    if (this.sucursalSeleccionada !== null && 
        this.sucursalSeleccionada !== undefined && 
        this.sucursalSeleccionada !== 0 &&
        !isNaN(Number(this.sucursalSeleccionada))) {
      params.sucursal_id = Number(this.sucursalSeleccionada);
    }

    this.reporteService.getUtilidadesPorSucursal(params).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.utilidades = response.data;
          this.calcularTotalesGenerales();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error cargando utilidades por sucursal:', error);
        this.isLoading = false;
      }
    });
  }

  calcularTotalesGenerales(): void {
    this.totalGeneral = {
      total_ventas: this.utilidades.reduce((sum, u) => sum + (u.total_ventas || 0), 0),
      total_compras: this.utilidades.reduce((sum, u) => sum + (u.total_compras || 0), 0),
      utilidad_total: this.utilidades.reduce((sum, u) => sum + (u.utilidad || 0), 0),
      margen_promedio: 0
    };

    // Calcular margen promedio
    if (this.totalGeneral.total_ventas > 0) {
      this.totalGeneral.margen_promedio = 
        (this.totalGeneral.utilidad_total / this.totalGeneral.total_ventas) * 100;
    }
  }

  getColorUtilidad(utilidad: number): string {
    if (utilidad > 0) {
      return 'text-green-600 dark:text-green-400';
    } else if (utilidad < 0) {
      return 'text-red-600 dark:text-red-400';
    }
    return 'text-gray-600 dark:text-gray-400';
  }

  getColorMargen(margen: number): string {
    if (margen >= 30) {
      return 'text-green-600 dark:text-green-400';
    } else if (margen >= 15) {
      return 'text-yellow-600 dark:text-yellow-400';
    } else if (margen >= 0) {
      return 'text-orange-600 dark:text-orange-400';
    }
    return 'text-red-600 dark:text-red-400';
  }

  exportarExcel(): void {
    const params: any = {
      fecha_desde: this.fechaDesde,
      fecha_hasta: this.fechaHasta
    };
    
    // Solo agregar sucursal_id si hay una sucursal seleccionada válida
    if (this.sucursalSeleccionada !== null && 
        this.sucursalSeleccionada !== undefined && 
        this.sucursalSeleccionada !== 0 &&
        !isNaN(Number(this.sucursalSeleccionada))) {
      params.sucursal_id = Number(this.sucursalSeleccionada);
    }
    
    this.reporteService.exportUtilidadesSucursalExcel(params);
  }

  exportarPDF(): void {
    const params: any = {
      fecha_desde: this.fechaDesde,
      fecha_hasta: this.fechaHasta
    };
    
    // Solo agregar sucursal_id si hay una sucursal seleccionada válida
    if (this.sucursalSeleccionada !== null && 
        this.sucursalSeleccionada !== undefined && 
        this.sucursalSeleccionada !== 0 &&
        !isNaN(Number(this.sucursalSeleccionada))) {
      params.sucursal_id = Number(this.sucursalSeleccionada);
    }
    
    this.reporteService.exportUtilidadesSucursalPDF(params);
  }
}

