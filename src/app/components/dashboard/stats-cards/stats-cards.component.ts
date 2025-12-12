import { Component, Input } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-stats-cards',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  templateUrl: './stats-cards.component.html',
})
export class StatsCardsComponent {
  @Input() ventasHoy: number = 0;
  @Input() ventasMes: number = 0;
  @Input() totalVentas: number = 0;
  @Input() crecimientoVentas: number = 0;
  @Input() productosBajoStockCount: number = 0;
  @Input() productosAgotados: number = 0;
  @Input() valorTotalInventario: number = 0;
  @Input() margenBruto: number = 0;
  @Input() creditosPendientes: number = 0;
}

