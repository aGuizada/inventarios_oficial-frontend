import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DashboardService } from '../../services/dashboard.service';
import { finalize } from 'rxjs/operators';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { forkJoin } from 'rxjs';
import { DateFilter } from '../../interfaces/date-filter.interface';

// Import child components
import { StatsCardsComponent } from './stats-cards/stats-cards.component';
import { RecentSalesComponent } from './recent-sales/recent-sales.component';
import { LowStockComponent } from './low-stock/low-stock.component';
import { DateFilterComponent } from './date-filter/date-filter.component';
import { ArticleProfitComponent } from './article-profit/article-profit.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    StatsCardsComponent,
    RecentSalesComponent,
    LowStockComponent,
    DateFilterComponent,
    ArticleProfitComponent,
    BaseChartDirective
  ],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {

  // Datos
  ventasRecientes: any[] = [];
  productosBajoStock: any[] = [];
  clientesMasFrecuentes: any[] = [];
  productosMasComprados: any[] = [];
  productosMasVendidos: any[] = [];
  productosMenosVendidos: any[] = [];

  // KPIs Ampliados
  ventasHoy: number = 0;
  ventasMes: number = 0;
  ventasMesAnterior: number = 0;
  totalVentas: number = 0;
  crecimientoVentas: number = 0;
  productosBajoStockCount: number = 0;
  productosAgotados: number = 0;
  valorTotalInventario: number = 0;
  comprasMes: number = 0;
  creditosPendientes: number = 0;
  montoCreditosPendientes: number = 0;
  margenBruto: number = 0;

  // Alertas
  alertas: any = null;

  // Resumen Cajas
  resumenCajas: any = null;

  // Rotación Inventario
  rotacionInventario: any = null;

  // Filtros de fecha
  filtrosActivos: DateFilter | null = null;
  filtrosAplicados = false;

  // Gráficos
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true },
      title: { display: true, text: 'Top 5 Productos Más Vendidos' }
    }
  };
  public barChartType: ChartType = 'bar';
  public barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      { data: [], label: 'Ventas ($)', backgroundColor: '#3b82f6' }
    ]
  };

  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' },
      title: { display: true, text: 'Distribución de Stock' }
    }
  };
  public pieChartType: ChartType = 'doughnut';
  public pieChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [
      { data: [], backgroundColor: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'] }
    ]
  };

  // Gráfico de Tendencia de Ventas (Línea)
  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true },
      title: { display: true, text: 'Tendencia de Ventas (Últimos 7 días)' }
    }
  };
  public lineChartType: ChartType = 'line';
  public lineChartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      { data: [], label: 'Ventas ($)', borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', fill: true, tension: 0.4 }
    ]
  };

  // Gráfico de Valor por Categoría
  public categoryChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' },
      title: { display: true, text: 'Valor de Inventario por Categoría' }
    }
  };
  public categoryChartType: ChartType = 'doughnut';
  public categoryChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [
      { data: [], backgroundColor: ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308'] }
    ]
  };

  // Comparativa Ventas vs Compras
  public comparisonChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true },
      title: { display: true, text: 'Ventas vs Compras (Últimos 6 Meses)' }
    }
  };
  public comparisonChartType: ChartType = 'bar';
  public comparisonChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      { data: [], label: 'Ventas', backgroundColor: '#10b981' },
      { data: [], label: 'Compras', backgroundColor: '#ef4444' }
    ]
  };

  // Top Proveedores
  public supplierChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Top 5 Proveedores por Volumen de Compra' }
    }
  };
  public supplierChartType: ChartType = 'bar';
  public supplierChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      { data: [], label: 'Total Comprado ($)', backgroundColor: '#8b5cf6' }
    ]
  };

  isLoading = false;

  constructor(
    private dashboardService: DashboardService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.isLoading = true;

    // Cargar todos los datos en paralelo usando forkJoin
    forkJoin({
      kpis: this.dashboardService.getKpis(),
      alertas: this.dashboardService.getAlertas(),
      resumenCajas: this.dashboardService.getResumenCajas(),
      rotacionInventario: this.dashboardService.getRotacionInventario(),
      ventasRecientes: this.dashboardService.getVentasRecientes(),
      productosTop: this.dashboardService.getProductosTop(),
      ventasChart: this.dashboardService.getVentasChart(),
      inventarioChart: this.dashboardService.getInventarioChart(),
      comparativaChart: this.dashboardService.getComparativaChart(),
      proveedoresTop: this.dashboardService.getProveedoresTop(),
      clientesFrecuentes: this.dashboardService.getClientesFrecuentes(),
      productosBajoStock: this.dashboardService.getProductosBajoStock(),
      productosMasComprados: this.dashboardService.getProductosMasComprados(),
      topStock: this.dashboardService.getTopStock()
    }).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (data) => {
        // KPIs Ampliados
        this.ventasHoy = data.kpis.ventas_hoy;
        this.ventasMes = data.kpis.ventas_mes;
        this.ventasMesAnterior = data.kpis.ventas_mes_anterior;
        this.totalVentas = data.kpis.total_ventas;
        this.crecimientoVentas = data.kpis.crecimiento_ventas;
        this.productosBajoStockCount = data.kpis.productos_bajo_stock;
        this.productosAgotados = data.kpis.productos_agotados;
        this.valorTotalInventario = data.kpis.valor_total_inventario;
        this.comprasMes = data.kpis.compras_mes;
        this.creditosPendientes = data.kpis.creditos_pendientes;
        this.montoCreditosPendientes = data.kpis.monto_creditos_pendientes;
        this.margenBruto = data.kpis.margen_bruto;

        // Nuevas métricas
        this.alertas = data.alertas;
        this.resumenCajas = data.resumenCajas;
        this.rotacionInventario = data.rotacionInventario;

        // Ventas recientes
        this.ventasRecientes = data.ventasRecientes;

        // Productos
        this.productosMasVendidos = data.productosTop.mas_vendidos;
        this.productosMenosVendidos = data.productosTop.menos_vendidos;
        this.productosMasComprados = data.productosMasComprados;
        this.productosBajoStock = data.productosBajoStock;

        // Clientes
        this.clientesMasFrecuentes = data.clientesFrecuentes;

        // Gráfico de Tendencia de Ventas
        this.lineChartData = {
          labels: data.ventasChart.labels,
          datasets: [{
            data: data.ventasChart.data,
            label: 'Ventas ($)',
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.4
          }]
        };

        // Gráfico de productos más vendidos
        if (this.productosMasVendidos.length > 0) {
          this.barChartData = {
            labels: this.productosMasVendidos.map(p => p.articulo?.nombre_articulo || `Artículo #${p.articulo_id}`),
            datasets: [{
              data: this.productosMasVendidos.map(p => p.total_ventas),
              label: 'Ventas ($)',
              backgroundColor: '#3b82f6'
            }]
          };
        }

        // Gráfico de inventario por categoría
        this.categoryChartData = {
          labels: data.inventarioChart.labels,
          datasets: [{
            data: data.inventarioChart.data,
            backgroundColor: ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308']
          }]
        };

        // Gráfico de comparativa ventas vs compras
        this.comparisonChartData = {
          labels: data.comparativaChart.labels,
          datasets: [
            { data: data.comparativaChart.ventas, label: 'Ventas', backgroundColor: '#10b981' },
            { data: data.comparativaChart.compras, label: 'Compras', backgroundColor: '#ef4444' }
          ]
        };

        // Gráfico de proveedores
        this.supplierChartData = {
          labels: data.proveedoresTop.labels,
          datasets: [{
            data: data.proveedoresTop.data,
            label: 'Total Comprado ($)',
            backgroundColor: '#8b5cf6'
          }]
        };

        // Gráfico de stock (pie chart)
        this.pieChartData = {
          labels: data.topStock.labels,
          datasets: [{
            data: data.topStock.data,
            backgroundColor: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444']
          }]
        };
      },
      error: (error) => {
        console.error('Error al cargar datos del dashboard:', error);
        this.isLoading = false;
      }
    });
  }

  navegarAVentas(): void {
    this.router.navigate(['/ventas/historial']);
  }

  navegarAInventario(): void {
    this.router.navigate(['/inventario/stock']);
  }

  getNombreArticulo(articuloId: number, articulo?: any): string {
    if (articulo?.nombre_articulo) return articulo.nombre_articulo;
    if (articulo?.nombre) return articulo.nombre;
    return `Artículo #${articuloId}`;
  }

  getNombreCliente(clienteId: number, cliente?: any): string {
    if (cliente?.nombre_cliente) return cliente.nombre_cliente;
    if (cliente?.nombre) return cliente.nombre;
    return `Cliente #${clienteId}`;
  }

  /**
   * Maneja cambios en el filtro de fecha
   */
  onFiltrosChanged(filtros: DateFilter): void {
    this.filtrosActivos = filtros;
    this.filtrosAplicados = true;
    this.cargarDatosConFiltros(filtros);
  }

  /**
   * Maneja reset del filtro
   */
  onFiltrosReset(): void {
    this.filtrosActivos = null;
    this.filtrosAplicados = false;
    this.cargarDatos();
  }

  /**
   * Carga datos con filtros aplicados
   */
  private cargarDatosConFiltros(filtros: DateFilter): void {
    this.isLoading = true;

    forkJoin({
      kpis: this.dashboardService.getKpisFiltrados(filtros),
      ventasChart: this.dashboardService.getVentasChartFiltrado(filtros),
      // Los demás endpoints no cambian con los filtros
      alertas: this.dashboardService.getAlertas(),
      resumenCajas: this.dashboardService.getResumenCajas(),
      rotacionInventario: this.dashboardService.getRotacionInventario(),
      ventasRecientes: this.dashboardService.getVentasRecientes(),
      productosTop: this.dashboardService.getProductosTop(),
      inventarioChart: this.dashboardService.getInventarioChart(),
      comparativaChart: this.dashboardService.getComparativaChart(),
      proveedoresTop: this.dashboardService.getProveedoresTop(),
      clientesFrecuentes: this.dashboardService.getClientesFrecuentes(),
      productosBajoStock: this.dashboardService.getProductosBajoStock(),
      productosMasComprados: this.dashboardService.getProductosMasComprados(),
      topStock: this.dashboardService.getTopStock()
    }).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (data: any) => {
        // Extraer KPIs del Resource (viene con estructura anidada)
        const kpisData = data.kpis.data || data.kpis;
        const ventasData = kpisData.ventas || {};
        const inventarioData = kpisData.inventario || {};
        const comprasData = kpisData.compras || {};
        const creditosData = kpisData.creditos || {};
        const analisisData = kpisData.analisis || {};

        // Actualizar KPIs
        this.ventasHoy = ventasData.ventas_hoy || 0;
        this.ventasMes = ventasData.ventas_mes || 0;
        this.ventasMesAnterior = ventasData.ventas_mes_anterior || 0;
        this.totalVentas = ventasData.total_ventas || 0;
        this.crecimientoVentas = ventasData.crecimiento_ventas || 0;
        this.productosBajoStockCount = inventarioData.productos_bajo_stock || 0;
        this.productosAgotados = inventarioData.productos_agotados || 0;
        this.valorTotalInventario = inventarioData.valor_total_inventario || 0;
        this.comprasMes = comprasData.compras_mes || 0;
        this.creditosPendientes = creditosData.creditos_pendientes || 0;
        this.montoCreditosPendientes = creditosData.monto_creditos_pendientes || 0;
        this.margenBruto = analisisData.margen_bruto || 0;

        // Actualizar gráfico de ventas filtrado
        this.lineChartData = {
          labels: data.ventasChart.labels,
          datasets: [{
            data: data.ventasChart.data,
            label: 'Ventas ($)',
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.4
          }]
        };

        // Actualizar resto de datos (sin filtros)
        this.alertas = data.alertas;
        this.resumenCajas = data.resumenCajas;
        this.rotacionInventario = data.rotacionInventario;
        this.ventasRecientes = data.ventasRecientes;
        this.productosMasVendidos = data.productosTop.mas_vendidos;
        this.productosMenosVendidos = data.productosTop.menos_vendidos;
        this.productosMasComprados = data.productosMasComprados;
        this.productosBajoStock = data.productosBajoStock;
        this.clientesMasFrecuentes = data.clientesFrecuentes;

        // Actualizar otros gráficos
        if (this.productosMasVendidos.length > 0) {
          this.barChartData = {
            labels: this.productosMasVendidos.map(p => p.articulo?.nombre_articulo || `Artículo #${p.articulo_id}`),
            datasets: [{
              data: this.productosMasVendidos.map(p => p.total_ventas),
              label: 'Ventas ($)',
              backgroundColor: '#3b82f6'
            }]
          };
        }

        this.categoryChartData = {
          labels: data.inventarioChart.labels,
          datasets: [{
            data: data.inventarioChart.data,
            backgroundColor: ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308']
          }]
        };

        this.comparisonChartData = {
          labels: data.comparativaChart.labels,
          datasets: [
            { data: data.comparativaChart.ventas, label: 'Ventas', backgroundColor: '#10b981' },
            { data: data.comparativaChart.compras, label: 'Compras', backgroundColor: '#ef4444' }
          ]
        };

        this.supplierChartData = {
          labels: data.proveedoresTop.labels,
          datasets: [{
            data: data.proveedoresTop.data,
            label: 'Total Comprado ($)',
            backgroundColor: '#8b5cf6'
          }]
        };

        this.pieChartData = {
          labels: data.topStock.labels,
          datasets: [{
            data: data.topStock.data,
            backgroundColor: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444']
          }]
        };
      },
      error: (error) => {
        console.error('Error al cargar datos filtrados:', error);
        this.isLoading = false;
      }
    });
  }
}
