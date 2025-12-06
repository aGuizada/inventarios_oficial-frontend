import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { VentaService } from '../../services/venta.service';
import { InventarioService } from '../../services/inventario.service';
import { CompraService } from '../../services/compra.service';
import { ClienteService } from '../../services/cliente.service';
import { Venta, Inventario, Compra, Cliente, Articulo } from '../../interfaces';
import { finalize } from 'rxjs/operators';

// Import child components
import { StatsCardsComponent } from './stats-cards/stats-cards.component';
import { RecentSalesComponent } from './recent-sales/recent-sales.component';
import { LowStockComponent } from './low-stock/low-stock.component';

interface ProductoVendido {
  articulo_id: number;
  articulo?: Articulo;
  cantidad_vendida: number;
  total_ventas: number;
}

interface ProductoComprado {
  articulo_id: number;
  articulo?: Articulo;
  cantidad_comprada: number;
  total_compras: number;
}

interface ClienteFrecuente {
  cliente_id: number;
  cliente?: Cliente;
  cantidad_ventas: number;
  total_gastado: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    StatsCardsComponent,
    RecentSalesComponent,
    LowStockComponent
  ],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  // Stats
  ventasDelDia: number = 0;
  productosBajos: number = 0;
  nuevosClientes: number = 0;
  totalVentas: number = 0;

  // Datos
  ventasRecientes: Venta[] = [];
  productosBajoStock: Inventario[] = [];
  clientesMasFrecuentes: ClienteFrecuente[] = [];
  productosMasComprados: ProductoComprado[] = [];
  productosMasVendidos: ProductoVendido[] = [];
  productosMenosVendidos: ProductoVendido[] = [];

  isLoading = false;

  constructor(
    private ventaService: VentaService,
    private inventarioService: InventarioService,
    private compraService: CompraService,
    private clienteService: ClienteService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.isLoading = true;
    this.cargarVentas();
    this.cargarInventarios();
    this.cargarCompras();
  }

  cargarVentas(): void {
    this.ventaService.getAll().subscribe({
      next: (ventas: Venta[] | any) => {
        const ventasArray = Array.isArray(ventas) ? ventas : (ventas?.data || []);
        
        // Ventas del día
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const ventasHoy = ventasArray.filter((v: any) => {
          const fechaVenta = new Date(v.fecha_hora);
          fechaVenta.setHours(0, 0, 0, 0);
          return fechaVenta.getTime() === hoy.getTime();
        });
        this.ventasDelDia = ventasHoy.reduce((sum: number, v: any) => sum + Number(v.total || 0), 0);
        this.totalVentas = ventasArray.reduce((sum: number, v: any) => sum + Number(v.total || 0), 0);

        // Ventas recientes (últimas 5)
        this.ventasRecientes = ventasArray
          .sort((a: any, b: any) => new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime())
          .slice(0, 5);

        // Clientes más frecuentes
        this.calcularClientesMasFrecuentes(ventasArray);

        // Productos más vendidos y menos vendidos
        this.calcularProductosVendidos(ventasArray);
      },
      error: (error) => {
        console.error('Error al cargar ventas:', error);
        this.isLoading = false;
      }
    });
  }

  cargarInventarios(): void {
    this.inventarioService.getAll().subscribe({
      next: (inventarios: Inventario[] | any) => {
        const inventariosArray = Array.isArray(inventarios) ? inventarios : (inventarios?.data || []);
        
        // Productos con stock bajo (menor a 10)
        this.productosBajoStock = inventariosArray
          .filter((inv: Inventario) => inv.saldo_stock < 10)
          .sort((a: Inventario, b: Inventario) => a.saldo_stock - b.saldo_stock)
          .slice(0, 10);
        
        this.productosBajos = this.productosBajoStock.length;
      },
      error: (error) => {
        console.error('Error al cargar inventarios:', error);
      }
    });
  }

  cargarCompras(): void {
    this.compraService.getAll().subscribe({
      next: (compras: Compra[] | any) => {
        const comprasArray = Array.isArray(compras) ? compras : (compras?.data || []);
        this.calcularProductosMasComprados(comprasArray);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar compras:', error);
        this.isLoading = false;
      }
    });
  }

  calcularClientesMasFrecuentes(ventas: any[]): void {
    const clientesMap = new Map<number, ClienteFrecuente>();

    ventas.forEach((venta: any) => {
      if (!venta.cliente_id) return;
      
      const clienteId = venta.cliente_id;
      if (!clientesMap.has(clienteId)) {
        clientesMap.set(clienteId, {
          cliente_id: clienteId,
          cliente: venta.cliente,
          cantidad_ventas: 0,
          total_gastado: 0
        });
      }

      const cliente = clientesMap.get(clienteId)!;
      cliente.cantidad_ventas++;
      cliente.total_gastado += Number(venta.total || 0);
    });

    this.clientesMasFrecuentes = Array.from(clientesMap.values())
      .sort((a, b) => b.cantidad_ventas - a.cantidad_ventas)
      .slice(0, 5);
  }

  calcularProductosVendidos(ventas: any[]): void {
    const productosMap = new Map<number, ProductoVendido>();

    ventas.forEach((venta: any) => {
      if (!venta.detalles || !Array.isArray(venta.detalles)) return;

      venta.detalles.forEach((detalle: any) => {
        const articuloId = detalle.articulo_id;
        if (!articuloId) return;
        
        if (!productosMap.has(articuloId)) {
          productosMap.set(articuloId, {
            articulo_id: articuloId,
            articulo: detalle.articulo,
            cantidad_vendida: 0,
            total_ventas: 0
          });
        }

        const producto = productosMap.get(articuloId)!;
        producto.cantidad_vendida += Number(detalle.cantidad || 0);
        producto.total_ventas += Number(detalle.precio || 0) * Number(detalle.cantidad || 0);
      });
    });

    const productosArray = Array.from(productosMap.values());
    
    // Productos más vendidos
    this.productosMasVendidos = productosArray
      .sort((a, b) => b.cantidad_vendida - a.cantidad_vendida)
      .slice(0, 5);

    // Productos menos vendidos (solo los que tienen al menos 1 venta)
    this.productosMenosVendidos = productosArray
      .filter(p => p.cantidad_vendida > 0)
      .sort((a, b) => a.cantidad_vendida - b.cantidad_vendida)
      .slice(0, 5);
  }

  calcularProductosMasComprados(compras: any[]): void {
    const productosMap = new Map<number, ProductoComprado>();

    compras.forEach((compra: any) => {
      if (!compra.detalles || !Array.isArray(compra.detalles)) return;

      compra.detalles.forEach((detalle: any) => {
        const articuloId = detalle.articulo_id;
        if (!articuloId) return;
        
        if (!productosMap.has(articuloId)) {
          productosMap.set(articuloId, {
            articulo_id: articuloId,
            articulo: detalle.articulo,
            cantidad_comprada: 0,
            total_compras: 0
          });
        }

        const producto = productosMap.get(articuloId)!;
        producto.cantidad_comprada += Number(detalle.cantidad || 0);
        producto.total_compras += Number(detalle.precio_unitario || 0) * Number(detalle.cantidad || 0);
      });
    });

    this.productosMasComprados = Array.from(productosMap.values())
      .sort((a, b) => b.cantidad_comprada - a.cantidad_comprada)
      .slice(0, 5);
  }


  navegarAVentas(): void {
    this.router.navigate(['/ventas/historial']);
  }

  navegarAInventario(): void {
    this.router.navigate(['/inventario/stock']);
  }

  getNombreArticulo(articuloId: number, articulo?: Articulo): string {
    if (articulo?.nombre) return articulo.nombre;
    return `Artículo #${articuloId}`;
  }

  getNombreCliente(clienteId: number, cliente?: Cliente): string {
    if (cliente?.nombre) return cliente.nombre;
    return `Cliente #${clienteId}`;
  }
}
