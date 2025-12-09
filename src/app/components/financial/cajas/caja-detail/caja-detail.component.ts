import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { Caja } from '../../../../interfaces';
import { CajaService } from '../../../../services/caja.service';
import { VentaService } from '../../../../services/venta.service';
import { CompraService } from '../../../../services/compra.service';
import { TransaccionCajaService } from '../../../../services/transaccion-caja.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-caja-detail',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, NgClass],
  templateUrl: './caja-detail.component.html',
})
export class CajaDetailComponent implements OnInit {
  @Input() caja: Caja | null = null;
  @Output() close = new EventEmitter<void>();

  isLoading = false;
  ventas: any[] = [];
  compras: any[] = [];
  transacciones: any[] = [];

  constructor(
    private cajaService: CajaService,
    private ventaService: VentaService,
    private compraService: CompraService,
    private transaccionCajaService: TransaccionCajaService
  ) {}

  ngOnInit(): void {
    if (this.caja) {
      this.loadCajaDetails();
    }
  }

  loadCajaDetails(): void {
    if (!this.caja) return;

    this.isLoading = true;
    
    // Cargar ventas de la caja
    this.ventaService.getAll().subscribe({
      next: (ventas) => {
        this.ventas = ventas.filter((v: any) => v.caja_id === this.caja?.id);
        this.calculateTotals();
      },
      error: (error) => console.error('Error loading ventas', error)
    });

    // Cargar compras de la caja
    this.compraService.getAll().subscribe({
      next: (compras) => {
        this.compras = compras.filter((c: any) => c.caja_id === this.caja?.id);
        this.calculateTotals();
      },
      error: (error) => console.error('Error loading compras', error)
    });

    // Cargar transacciones de la caja
    this.transaccionCajaService.getByCaja(this.caja.id).subscribe({
      next: (response) => {
        this.transacciones = response.data || [];
        this.isLoading = false;
      },
      error: (error) => {
        // Si el endpoint no existe (404), usar getAll y filtrar
        if (error.status === 404) {
          this.transaccionCajaService.getAll().subscribe({
            next: (response) => {
              this.transacciones = (response.data || []).filter((t: any) => t.caja_id === this.caja?.id);
              this.isLoading = false;
            },
            error: (err) => {
              console.error('Error loading transacciones', err);
              this.transacciones = [];
              this.isLoading = false;
            }
          });
        } else {
          console.error('Error loading transacciones', error);
          this.transacciones = [];
          this.isLoading = false;
        }
      }
    });
  }

  calculateTotals(): void {
    // Los totales ya vienen en la caja, pero podemos recalcular si es necesario
    this.isLoading = false;
  }

  getVentasContado(): number {
    // Usar el valor de la caja si está disponible, sino calcular desde ventas
    if (this.caja?.ventas_contado !== undefined && this.caja.ventas_contado !== null) {
      return Number(this.caja.ventas_contado) || 0;
    }
    return this.ventas
      .filter((v: any) => {
        const tipoVenta = v.tipo_venta?.nombre_tipo_ventas || v.tipo_venta?.nombre || '';
        return tipoVenta.toLowerCase().includes('contado') || tipoVenta.toLowerCase().includes('efectivo');
      })
      .reduce((sum: number, v: any) => sum + (Number(v.total) || 0), 0);
  }

  getVentasCredito(): number {
    // Usar el valor de la caja si está disponible, sino calcular desde ventas
    if (this.caja?.ventas_credito !== undefined && this.caja.ventas_credito !== null) {
      return Number(this.caja.ventas_credito) || 0;
    }
    return this.ventas
      .filter((v: any) => {
        const tipoVenta = v.tipo_venta?.nombre_tipo_ventas || v.tipo_venta?.nombre || '';
        return tipoVenta.toLowerCase().includes('credito') || tipoVenta.toLowerCase().includes('crédito');
      })
      .reduce((sum: number, v: any) => sum + (Number(v.total) || 0), 0);
  }

  getVentasQR(): number {
    // Usar el valor de la caja si está disponible, sino calcular desde ventas
    if (this.caja?.pagos_qr !== undefined && this.caja.pagos_qr !== null) {
      return Number(this.caja.pagos_qr) || 0;
    }
    return this.ventas
      .filter((v: any) => {
        const tipoPago = v.tipo_pago?.nombre_tipo_pago || v.tipo_pago?.nombre || '';
        return tipoPago.toLowerCase().includes('qr') || tipoPago.toLowerCase().includes('qrcode');
      })
      .reduce((sum: number, v: any) => sum + (Number(v.total) || 0), 0);
  }

  getComprasContado(): number {
    // Usar el valor de la caja si está disponible, sino calcular desde compras
    if (this.caja?.compras_contado !== undefined && this.caja.compras_contado !== null) {
      return Number(this.caja.compras_contado) || 0;
    }
    return this.compras
      .filter((c: any) => c.tipo_compra === 'contado')
      .reduce((sum: number, c: any) => sum + (Number(c.total) || 0), 0);
  }

  getComprasCredito(): number {
    // Usar el valor de la caja si está disponible, sino calcular desde compras
    if (this.caja?.compras_credito !== undefined && this.caja.compras_credito !== null) {
      return Number(this.caja.compras_credito) || 0;
    }
    return this.compras
      .filter((c: any) => c.tipo_compra === 'credito')
      .reduce((sum: number, c: any) => sum + (Number(c.total) || 0), 0);
  }

  getEntradas(): number {
    // Siempre usar el valor de la caja (depositos) si está disponible
    if (this.caja?.depositos !== undefined && this.caja.depositos !== null) {
      const valor = Number(this.caja.depositos);
      return isNaN(valor) ? 0 : valor;
    }
    // Si no hay valor en la caja, calcular desde transacciones
    return this.transacciones
      .filter((t: any) => t.transaccion === 'ingreso')
      .reduce((sum: number, t: any) => sum + (Number(t.importe) || 0), 0);
  }

  getSalidas(): number {
    // Siempre usar el valor de la caja (salidas) si está disponible
    if (this.caja?.salidas !== undefined && this.caja.salidas !== null) {
      const valor = Number(this.caja.salidas);
      return isNaN(valor) ? 0 : valor;
    }
    // Si no hay valor en la caja, calcular desde transacciones
    return this.transacciones
      .filter((t: any) => t.transaccion === 'egreso')
      .reduce((sum: number, t: any) => sum + (Number(t.importe) || 0), 0);
  }

  getTotalVentas(): number {
    // Usar el valor de la caja si está disponible, sino calcular desde ventas
    if (this.caja?.ventas !== undefined && this.caja.ventas !== null) {
      return Number(this.caja.ventas) || 0;
    }
    return this.ventas.reduce((sum: number, v: any) => sum + (Number(v.total) || 0), 0);
  }

  getTotalCompras(): number {
    // Calcular desde compras
    return this.compras.reduce((sum: number, c: any) => sum + (Number(c.total) || 0), 0);
  }

  getSaldoFinal(): number {
    if (!this.caja) return 0;
    // Usar saldo_caja si está disponible, sino calcular
    if (this.caja.saldo_caja !== undefined && this.caja.saldo_caja !== null) {
      return Number(this.caja.saldo_caja) || 0;
    }
    return (Number(this.caja.saldo_inicial) || 0) + 
           this.getTotalVentas() + 
           this.getEntradas() - 
           this.getTotalCompras() - 
           this.getSalidas();
  }

  onClose(): void {
    this.close.emit();
  }
}

