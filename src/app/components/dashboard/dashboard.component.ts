import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  stats = [
    { title: 'Ventas del Día', value: 'Bs. 1,250.00', icon: 'fas fa-shopping-cart', color: 'bg-blue-500' },
    { title: 'Pedidos Pendientes', value: '12', icon: 'fas fa-clock', color: 'bg-orange-500' },
    { title: 'Productos Bajos', value: '5', icon: 'fas fa-exclamation-triangle', color: 'bg-red-500' },
    { title: 'Nuevos Clientes', value: '3', icon: 'fas fa-user-plus', color: 'bg-green-500' }
  ];
}
