import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Caja } from '../../../../interfaces';
import { VentaService } from '../../../../services/venta.service';
import { CompraService } from '../../../../services/compra.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-caja-arqueo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CurrencyPipe, DatePipe, NgClass],
  templateUrl: './caja-arqueo.component.html',
})
export class CajaArqueoComponent implements OnInit {
  @Input() caja: Caja | null = null;

  @Output() close = new EventEmitter<{ saldoFisico: number, saldoFaltante: number }>();
  @Output() cancel = new EventEmitter<void>();
  @Output() resumen = new EventEmitter<void>();

  form: FormGroup;
  fechaCierre: Date = new Date();
  ventas: any[] = [];
  compras: any[] = [];
  isLoadingData = false;

  constructor(
    private fb: FormBuilder,
    private ventaService: VentaService,
    private compraService: CompraService
  ) {
    this.form = this.fb.group({
      saldo_fisico: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    if (this.caja) {
      // Establecer el saldo físico inicial como el saldo total calculado
      const saldoTotal = this.getSaldoTotal();
      this.form.patchValue({
        saldo_fisico: saldoTotal
      });
    }
  }

  getSaldoInicial(): number {
    if (!this.caja) return 0;
    const valor = Number(this.caja.saldo_inicial);
    return isNaN(valor) ? 0 : valor;
  }

  getVentasTotales(): number {
    if (!this.caja) return 0;
    if (this.caja.ventas !== undefined && this.caja.ventas !== null) {
      const valor = Number(this.caja.ventas);
      return isNaN(valor) ? 0 : valor;
    }
    const contado = Number(this.caja.ventas_contado) || 0;
    const credito = Number(this.caja.ventas_credito) || 0;
    const qr = Number(this.caja.pagos_qr) || 0;
    return contado + credito + qr;
  }

  getVentasContado(): number {
    if (!this.caja) return 0;
    const valor = Number(this.caja.ventas_contado);
    return isNaN(valor) ? 0 : valor;
  }

  getVentasCredito(): number {
    if (!this.caja) return 0;
    const valor = Number(this.caja.ventas_credito);
    return isNaN(valor) ? 0 : valor;
  }

  getVentasQR(): number {
    if (!this.caja) return 0;
    const valor = Number(this.caja.pagos_qr);
    return isNaN(valor) ? 0 : valor;
  }

  getComprasTotales(): number {
    if (!this.caja) return 0;
    const contado = Number(this.caja.compras_contado) || 0;
    const credito = Number(this.caja.compras_credito) || 0;
    return contado + credito;
  }

  getComprasContado(): number {
    if (!this.caja) return 0;
    const valor = Number(this.caja.compras_contado);
    return isNaN(valor) ? 0 : valor;
  }

  getComprasCredito(): number {
    if (!this.caja) return 0;
    const valor = Number(this.caja.compras_credito);
    return isNaN(valor) ? 0 : valor;
  }

  getEntradas(): number {
    if (!this.caja) return 0;
    const valor = Number(this.caja.depositos);
    return isNaN(valor) ? 0 : valor;
  }

  getSalidas(): number {
    if (!this.caja) return 0;
    const valor = Number(this.caja.salidas);
    return isNaN(valor) ? 0 : valor;
  }

  getSaldoTotal(): number {
    if (!this.caja) return 0;
    
    // Si existe saldo_caja, usarlo
    if (this.caja.saldo_caja !== undefined && this.caja.saldo_caja !== null) {
      const valor = Number(this.caja.saldo_caja);
      if (!isNaN(valor)) {
        return valor;
      }
    }
    
    // Calcular: Saldo Inicial + Ventas Totales + Entradas - Compras Totales - Salidas
    return this.getSaldoInicial() + 
           this.getVentasTotales() + 
           this.getEntradas() - 
           this.getComprasTotales() - 
           this.getSalidas();
  }

  getSaldoFisico(): number {
    const valor = Number(this.form.value.saldo_fisico);
    return isNaN(valor) ? 0 : valor;
  }

  getDiferencia(): number {
    return this.getSaldoFisico() - this.getSaldoTotal();
  }

  getSaldoFaltante(): number {
    const diferencia = this.getDiferencia();
    return diferencia < 0 ? Math.abs(diferencia) : 0;
  }

  getSobrante(): number {
    const diferencia = this.getDiferencia();
    return diferencia > 0 ? diferencia : 0;
  }

  onSubmit(): void {
    if (this.form.invalid || !this.caja) {
      this.form.markAllAsTouched();
      return;
    }

    const saldoFisico = this.getSaldoFisico();
    const saldoFaltante = this.getSaldoFaltante();

    this.close.emit({ saldoFisico, saldoFaltante });
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onResumen(): void {
    this.loadDataForPDF();
  }

  loadDataForPDF(): void {
    if (!this.caja) return;

    this.isLoadingData = true;

    const ventas$ = this.ventaService.getAll().pipe(
      catchError(() => of([]))
    );

    const compras$ = this.compraService.getAll().pipe(
      catchError(() => of([]))
    );

    forkJoin({
      ventas: ventas$,
      compras: compras$
    }).subscribe({
      next: (results) => {
        this.ventas = (results.ventas || []).filter((v: any) => v.caja_id === this.caja?.id);
        this.compras = (results.compras || []).filter((c: any) => c.caja_id === this.caja?.id);
        this.isLoadingData = false;
        this.generatePDF();
      },
      error: () => {
        this.ventas = [];
        this.compras = [];
        this.isLoadingData = false;
        this.generatePDF();
      }
    });
  }

  generatePDF(): void {
    if (!this.caja) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPos = margin;
    const lineHeight = 6;

    // Título
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMEN DE CIERRE DE CAJA', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;

    // Información de la caja
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Caja #${this.caja.id}`, margin, yPos);
    yPos += lineHeight;
    
    const fechaApertura = this.caja.fecha_apertura ? this.formatDateTime(this.caja.fecha_apertura) : 'No disponible';
    doc.text(`Fecha Apertura: ${fechaApertura}`, margin, yPos);
    yPos += lineHeight;
    
    const fechaCierre = this.caja.fecha_cierre ? this.formatDateTime(this.caja.fecha_cierre) : 'No disponible';
    doc.text(`Fecha Cierre: ${fechaCierre}`, margin, yPos);
    yPos += 10;

    // RESUMEN GENERAL
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMEN GENERAL', margin, yPos);
    yPos += lineHeight + 2;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const saldoInicial = this.getSaldoInicial();
    const ventasContado = this.getVentasContado();
    const pagosQR = this.getVentasQR();
    const ventasAdelantadas = 0; // No disponible en el modelo actual
    const pagosCuotas = Number(this.caja.cuotas_ventas_credito) || 0;
    const pagosTransferencia = Number(this.caja.pagos_transferencia) || 0;
    const depositos = this.getEntradas();
    const compras = this.getComprasTotales();
    const salidas = this.getSalidas();
    const saldoFinal = this.getSaldoTotal();

    doc.text(`Saldo Inicial: ${this.formatCurrencyBOB(saldoInicial)}`, margin, yPos);
    yPos += lineHeight;
    doc.text(`Ventas al Contado: ${this.formatCurrencyBOB(ventasContado)}`, margin, yPos);
    yPos += lineHeight;
    doc.text(`Pagos QR: ${this.formatCurrencyBOB(pagosQR)}`, margin, yPos);
    yPos += lineHeight;
    doc.text(`Ventas Adelantadas: ${this.formatCurrencyBOB(ventasAdelantadas)}`, margin, yPos);
    yPos += lineHeight;
    doc.text(`Pagos de Cuotas: ${this.formatCurrencyBOB(pagosCuotas)}`, margin, yPos);
    yPos += lineHeight;
    doc.text(`Pagos por Transferencia: ${this.formatCurrencyBOB(pagosTransferencia)}`, margin, yPos);
    yPos += lineHeight;
    doc.text(`Depósitos: ${this.formatCurrencyBOB(depositos)}`, margin, yPos);
    yPos += lineHeight;
    doc.text(`Compras: ${this.formatCurrencyBOB(compras)}`, margin, yPos);
    yPos += lineHeight;
    doc.text(`Salidas: ${this.formatCurrencyBOB(salidas)}`, margin, yPos);
    yPos += lineHeight;
    doc.setFont('helvetica', 'bold');
    doc.text(`Saldo Final: ${this.formatCurrencyBOB(saldoFinal)}`, margin, yPos);
    yPos += lineHeight + 5;

    // Verificar si necesitamos nueva página
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = margin;
    }

    // VENTAS POR MÉTODO DE PAGO
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('VENTAS POR MÉTODO DE PAGO', margin, yPos);
    yPos += lineHeight + 3;

    // Agrupar ventas por método de pago
    const ventasPorMetodo = this.groupVentasByMetodoPago();
    
    // Encabezado de tabla
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Método de Pago', margin, yPos);
    doc.text('Cantidad', margin + 60, yPos);
    doc.text('Total (Bs.)', margin + 100, yPos);
    yPos += lineHeight;
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 3;

    // Filas de la tabla
    doc.setFont('helvetica', 'normal');
    for (const metodo of ventasPorMetodo) {
      doc.text(metodo.nombre, margin, yPos);
      doc.text(metodo.cantidad.toString(), margin + 60, yPos);
      doc.text(this.formatCurrencyBOB(metodo.total), margin + 100, yPos);
      yPos += lineHeight;
    }
    yPos += 5;

    // Verificar si necesitamos nueva página
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = margin;
    }

    // DETALLE DE VENTAS
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLE DE VENTAS', margin, yPos);
    yPos += lineHeight + 3;

    // Encabezado de tabla de ventas
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    const ventasTableStartY = yPos;
    doc.text('Fecha y Hora', margin, yPos);
    doc.text('N° Comprobante', margin + 40, yPos);
    doc.text('Cliente', margin + 70, yPos);
    doc.text('Tipo de Venta', margin + 110, yPos);
    doc.text('Método de Pago', margin + 140, yPos);
    doc.text('Total (Bs.)', margin + 170, yPos);
    yPos += lineHeight;
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 3;

    // Filas de ventas
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    for (const venta of this.ventas) {
      if (yPos > pageHeight - 20) {
        doc.addPage();
        yPos = margin;
      }
      
      const fechaVenta = venta.fecha ? this.formatDateTime(venta.fecha) : 'N/A';
      const nroComprobante = venta.numero_comprobante || venta.numero_factura || 'N/A';
      const cliente = venta.cliente?.nombre || venta.cliente?.razon_social || 'SIN NOMBRE';
      const tipoVenta = venta.tipo_venta?.nombre_tipo_ventas || venta.tipo_venta?.nombre || 'Contado';
      const metodoPago = venta.tipo_pago?.nombre_tipo_pago || venta.tipo_pago?.nombre || 'Efectivo';
      const total = Number(venta.total) || 0;

      doc.text(fechaVenta.substring(0, 19), margin, yPos);
      doc.text(nroComprobante.substring(0, 8), margin + 40, yPos);
      doc.text(cliente.substring(0, 15), margin + 70, yPos);
      doc.text(tipoVenta.substring(0, 12), margin + 110, yPos);
      doc.text(metodoPago.substring(0, 12), margin + 140, yPos);
      doc.text(this.formatCurrencyBOB(total), margin + 170, yPos);
      yPos += lineHeight;
    }
    yPos += 5;

    // Verificar si necesitamos nueva página
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = margin;
    }

    // DETALLE DE COMPRAS
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLE DE COMPRAS', margin, yPos);
    yPos += lineHeight + 3;

    // Encabezado de tabla de compras
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Fecha y Hora', margin, yPos);
    doc.text('N° Comprobante', margin + 40, yPos);
    doc.text('Proveedor', margin + 80, yPos);
    doc.text('Tipo Comprobante', margin + 120, yPos);
    doc.text('Total (Bs.)', margin + 170, yPos);
    yPos += lineHeight;
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 3;

    // Filas de compras
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    for (const compra of this.compras) {
      if (yPos > pageHeight - 20) {
        doc.addPage();
        yPos = margin;
      }
      
      const fechaCompra = compra.fecha ? this.formatDateTime(compra.fecha) : 'N/A';
      const nroComprobante = compra.numero_comprobante || compra.numero_factura || 'No especificado';
      const proveedor = compra.proveedor?.nombre || compra.proveedor?.razon_social || 'N/A';
      const tipoComprobante = compra.tipo_comprobante || 'Recibo';
      const total = Number(compra.total) || 0;

      doc.text(fechaCompra.substring(0, 19), margin, yPos);
      doc.text(nroComprobante.substring(0, 12), margin + 40, yPos);
      doc.text(proveedor.substring(0, 20), margin + 80, yPos);
      doc.text(tipoComprobante.substring(0, 15), margin + 120, yPos);
      doc.text(this.formatCurrencyBOB(total), margin + 170, yPos);
      yPos += lineHeight;
    }
    yPos += 5;

    // Verificar si necesitamos nueva página
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = margin;
    }

    // TOTALES
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTALES', margin, yPos);
    yPos += lineHeight + 2;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const totalIngresos = saldoInicial + ventasContado + pagosQR + ventasAdelantadas + pagosCuotas + pagosTransferencia + depositos;
    const totalEgresos = compras + salidas;
    const saldoFinalCaja = saldoFinal;
    const pagosInicialesCreditos = 0; // No disponible en el modelo actual

    doc.text(`Total Ingresos: ${this.formatCurrencyBOB(totalIngresos)}`, margin, yPos);
    yPos += lineHeight;
    doc.text(`Total Egresos: ${this.formatCurrencyBOB(totalEgresos)}`, margin, yPos);
    yPos += lineHeight;
    doc.setFont('helvetica', 'bold');
    doc.text(`Saldo Final en Caja: ${this.formatCurrencyBOB(saldoFinalCaja)}`, margin, yPos);
    yPos += lineHeight;
    doc.setFont('helvetica', 'normal');
    doc.text(`Pagos Iniciales de Créditos ${this.formatCurrencyBOB(pagosInicialesCreditos)}`, margin, yPos);
    yPos += 10;

    // Pie de página
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    const fechaGeneracion = new Date().toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    doc.text(`Documento generado el ${fechaGeneracion}`, pageWidth / 2, pageHeight - 15, { align: 'center' });

    // Descargar PDF
    const fileName = `Resumen_Cierre_Caja_${this.caja.id}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }

  groupVentasByMetodoPago(): any[] {
    const grupos: { [key: string]: { nombre: string, cantidad: number, total: number } } = {};

    for (const venta of this.ventas) {
      const metodoPago = venta.tipo_pago?.nombre_tipo_pago || venta.tipo_pago?.nombre || 'Efectivo';
      const total = Number(venta.total) || 0;

      if (!grupos[metodoPago]) {
        grupos[metodoPago] = { nombre: metodoPago, cantidad: 0, total: 0 };
      }
      grupos[metodoPago].cantidad++;
      grupos[metodoPago].total += total;
    }

    // Ordenar por nombre
    return Object.values(grupos).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).replace(',', '');
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 2
    }).format(value);
  }

  formatCurrencyBOB(value: number): string {
    return `Bs. ${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  }
}

