import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { ReporteService } from '../../../services/reporte.service';
import { SucursalService } from '../../../services/sucursal.service';
import { MonedaPipe } from '../../../pipes/moneda.pipe';

interface CajaSucursal {
  sucursal_id: number;
  sucursal_nombre: string;
  total_ventas: number;
  ventas_contado: number;
  ventas_credito: number;
  ventas_qr: number;
  total_compras: number;
  compras_contado: number;
  compras_credito: number;
  depositos: number;
  salidas: number;
  utilidad: number;
  margen_porcentaje: number;
  cantidad_cajas: number;
  cajas_abiertas: number;
  cajas_cerradas: number;
}

@Component({
  selector: 'app-cajas-sucursal',
  standalone: true,
  imports: [CommonModule, FormsModule, MonedaPipe, NgClass],
  templateUrl: './cajas-sucursal.component.html'
})
export class CajasSucursalComponent implements OnInit {
  isLoading: boolean = false;
  cajas: CajaSucursal[] = [];
  fechaDesde: string = '';
  fechaHasta: string = '';
  sucursalSeleccionada: number | null = null;
  sucursales: any[] = [];
  totalGeneral: {
    total_ventas: number;
    ventas_contado: number;
    ventas_credito: number;
    ventas_qr: number;
    total_compras: number;
    compras_contado: number;
    compras_credito: number;
    depositos: number;
    salidas: number;
    utilidad_total: number;
    margen_promedio: number;
    cantidad_cajas: number;
  } = {
    total_ventas: 0,
    ventas_contado: 0,
    ventas_credito: 0,
    ventas_qr: 0,
    total_compras: 0,
    compras_contado: 0,
    compras_credito: 0,
    depositos: 0,
    salidas: 0,
    utilidad_total: 0,
    margen_promedio: 0,
    cantidad_cajas: 0
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
    this.cargarCajas();
  }

  cargarSucursales(): void {
    this.sucursalService.getAll().subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.sucursales = response.data;
        }
      },
      error: (error) => {
        console.error('Error cargando sucursales:', error);
      }
    });
  }

  cargarCajas(): void {
    if (!this.fechaDesde || !this.fechaHasta) {
      return;
    }

    this.isLoading = true;
    const params: any = {
      fecha_desde: this.fechaDesde,
      fecha_hasta: this.fechaHasta
    };
    
    // Asegurar que se envíe como número si está seleccionada
    if (this.sucursalSeleccionada && this.sucursalSeleccionada !== null) {
      params.sucursal_id = Number(this.sucursalSeleccionada);
    }

    this.reporteService.getCajasPorSucursal(params).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.cajas = response.data;
          this.calcularTotalesGenerales();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error cargando cajas por sucursal:', error);
        this.isLoading = false;
      }
    });
  }

  calcularTotalesGenerales(): void {
    this.totalGeneral = {
      total_ventas: this.cajas.reduce((sum, c) => sum + (c.total_ventas || 0), 0),
      ventas_contado: this.cajas.reduce((sum, c) => sum + (c.ventas_contado || 0), 0),
      ventas_credito: this.cajas.reduce((sum, c) => sum + (c.ventas_credito || 0), 0),
      ventas_qr: this.cajas.reduce((sum, c) => sum + (c.ventas_qr || 0), 0),
      total_compras: this.cajas.reduce((sum, c) => sum + (c.total_compras || 0), 0),
      compras_contado: this.cajas.reduce((sum, c) => sum + (c.compras_contado || 0), 0),
      compras_credito: this.cajas.reduce((sum, c) => sum + (c.compras_credito || 0), 0),
      depositos: this.cajas.reduce((sum, c) => sum + (c.depositos || 0), 0),
      salidas: this.cajas.reduce((sum, c) => sum + (c.salidas || 0), 0),
      utilidad_total: this.cajas.reduce((sum, c) => sum + (c.utilidad || 0), 0),
      margen_promedio: 0,
      cantidad_cajas: this.cajas.reduce((sum, c) => sum + (c.cantidad_cajas || 0), 0)
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
    
    // Asegurar que se envíe como número si está seleccionada
    if (this.sucursalSeleccionada && this.sucursalSeleccionada !== null) {
      params.sucursal_id = Number(this.sucursalSeleccionada);
    }
    
    this.reporteService.exportCajasSucursalExcel(params);
  }

  exportarPDF(): void {
    const params: any = {
      fecha_desde: this.fechaDesde,
      fecha_hasta: this.fechaHasta
    };
    
    // Asegurar que se envíe como número si está seleccionada
    if (this.sucursalSeleccionada && this.sucursalSeleccionada !== null) {
      params.sucursal_id = Number(this.sucursalSeleccionada);
    }
    
    this.reporteService.exportCajasSucursalPDF(params);
  }
}

