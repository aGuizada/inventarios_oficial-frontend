import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
  isOpen?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'fas fa-home',
      route: '/dashboard'
    },
    {
      label: 'Inventario',
      icon: 'fas fa-boxes',
      isOpen: false,
      children: [
        { label: 'Artículos', icon: 'fas fa-box', route: '/inventario/articulos' },
        { label: 'Categorías', icon: 'fas fa-tags', route: '/inventario/categorias' },
        { label: 'Marcas', icon: 'fas fa-copyright', route: '/inventario/marcas' },
        { label: 'Medidas', icon: 'fas fa-ruler', route: '/inventario/medidas' },
        { label: 'Industrias', icon: 'fas fa-industry', route: '/inventario/industrias' },
        { label: 'Stock', icon: 'fas fa-clipboard-list', route: '/inventario/stock' }
      ]
    },
    {
      label: 'Ventas',
      icon: 'fas fa-shopping-cart',
      isOpen: false,
      children: [
        { label: 'Nueva Venta', icon: 'fas fa-cash-register', route: '/ventas/nueva' },
        { label: 'Historial', icon: 'fas fa-history', route: '/ventas/historial' },
        { label: 'Cotizaciones', icon: 'fas fa-file-invoice', route: '/ventas/cotizaciones' },
        { label: 'Créditos', icon: 'fas fa-credit-card', route: '/ventas/creditos' }
      ]
    },
    {
      label: 'Compras',
      icon: 'fas fa-shopping-bag',
      isOpen: false,
      children: [
        { label: 'Nueva Compra', icon: 'fas fa-cart-plus', route: '/compras/nueva' },
        { label: 'Historial', icon: 'fas fa-history', route: '/compras/historial' },
        { label: 'Proveedores', icon: 'fas fa-truck', route: '/compras/proveedores' }
      ]
    },
    {
      label: 'Finanzas',
      icon: 'fas fa-wallet',
      isOpen: false,
      children: [
        { label: 'Cajas', icon: 'fas fa-cash-register', route: '/finanzas/cajas' },
        { label: 'Arqueos', icon: 'fas fa-calculator', route: '/finanzas/arqueos' },
        { label: 'Transacciones', icon: 'fas fa-exchange-alt', route: '/finanzas/transacciones' }
      ]
    },
    {
      label: 'Operaciones',
      icon: 'fas fa-cogs',
      isOpen: false,
      children: [
        { label: 'Traspasos', icon: 'fas fa-dolly', route: '/operaciones/traspasos' },
        { label: 'Precios', icon: 'fas fa-tags', route: '/operaciones/precios' },
        { label: 'Monedas', icon: 'fas fa-coins', route: '/operaciones/monedas' }
      ]
    },
    {
      label: 'Configuración',
      icon: 'fas fa-cog',
      isOpen: false,
      children: [
        { label: 'Usuarios', icon: 'fas fa-users', route: '/config/usuarios' },
        { label: 'Roles', icon: 'fas fa-user-shield', route: '/config/roles' },
        { label: 'Sucursales', icon: 'fas fa-store', route: '/config/sucursales' },
        { label: 'Almacenes', icon: 'fas fa-warehouse', route: '/config/almacenes' },
        { label: 'Empresa', icon: 'fas fa-building', route: '/config/empresa' },
        { label: 'Clientes', icon: 'fas fa-user-friends', route: '/config/clientes' }
      ]
    }
  ];

  toggleSubmenu(item: MenuItem): void {
    if (item.children) {
      item.isOpen = !item.isOpen;
    }
  }
}
