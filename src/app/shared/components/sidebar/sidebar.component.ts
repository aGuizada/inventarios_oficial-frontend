import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { SidebarService } from '../../../services/sidebar.service';
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
})
export class SidebarComponent implements OnInit, OnDestroy {
  isCollapsed = false;

  images = [
    '/assets/images/carousel-1.jpg',
    '/assets/images/carousel-2 (2).jpg'
  ];
  currentImageIndex = 0;
  private intervalId: any;

  private allMenuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'fas fa-home',
      route: '/dashboard'
    },
    {
      label: 'Catálogo',
      icon: 'fas fa-book',
      route: '/catalogo'
    },
    {
      label: 'Inventario',
      icon: 'fas fa-boxes',
      isOpen: false,
      children: [
        { label: 'Artículos', icon: 'fas fa-box', route: '/inventario/articulos' },
        { label: 'Catálogos', icon: 'fas fa-cog', route: '/inventario/catalogos' },
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
        { label: 'Créditos', icon: 'fas fa-credit-card', route: '/compras/creditos' },
        { label: 'Proveedores', icon: 'fas fa-truck', route: '/compras/proveedores' }
      ]
    },
    {
      label: 'Finanzas',
      icon: 'fas fa-wallet',
      isOpen: false,
      children: [
        { label: 'Cajas', icon: 'fas fa-cash-register', route: '/finanzas/cajas' },
      ]
    },
    {
      label: 'Operaciones',
      icon: 'fas fa-cogs',
      isOpen: false,
      children: [
        { label: 'Kardex', icon: 'fas fa-book', route: '/operaciones/kardex' },
        { label: 'Traspasos', icon: 'fas fa-dolly', route: '/operaciones/traspasos' },
        { label: 'Devoluciones', icon: 'fas fa-undo', route: '/operaciones/devoluciones' },
      ]
    },
    {
      label: 'Reportes',
      icon: 'fas fa-chart-bar',
      isOpen: false,
      children: [
        { label: 'Reportes Generales', icon: 'fas fa-chart-bar', route: '/reportes' },
        { label: 'Utilidades por Sucursal', icon: 'fas fa-chart-line', route: '/reportes/utilidades-sucursal' }
      ]
    },
    {
      label: 'Configuración',
      icon: 'fas fa-cog',
      isOpen: false,
      children: [
        { label: 'Usuarios', icon: 'fas fa-users', route: '/config/usuarios' },
        { label: 'Sucursales', icon: 'fas fa-store', route: '/config/sucursales' },
        { label: 'Almacenes', icon: 'fas fa-warehouse', route: '/config/almacenes' },
        { label: 'Clientes', icon: 'fas fa-user-friends', route: '/config/clientes' }
      ]
    }
  ];

  menuItems: MenuItem[] = [];

  constructor(
    private authService: AuthService,
    private sidebarService: SidebarService
  ) { }

  ngOnInit() {
    this.authService.currentUser$.subscribe(() => {
      this.updateMenu();
    });

    this.sidebarService.isCollapsed$.subscribe(collapsed => {
      this.isCollapsed = collapsed;
    });

    this.startCarousel();
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  startCarousel() {
    this.intervalId = setInterval(() => {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.images.length;
    }, 3000);
  }

  updateMenu() {
    if (this.authService.isVendedor()) {
      this.menuItems = this.allMenuItems.filter(item => {
        if (item.label === 'Catálogo') return true;
        if (item.label === 'Ventas') return true;

        if (item.label === 'Inventario') {
          return true;
        }

        if (item.label === 'Finanzas') {
          return true;
        }

        if (item.label === 'Operaciones') {
          return true;
        }

        if (item.label === 'Configuración') {
          return true;
        }

        return false;
      }).map(item => {
        const newItem = { ...item };

        if (newItem.label === 'Inventario' && newItem.children) {
          newItem.children = newItem.children.filter(child => child.label === 'Stock');
        }

        if (newItem.label === 'Finanzas' && newItem.children) {
          newItem.children = newItem.children.filter(child => child.label === 'Cajas');
        }

        if (newItem.label === 'Operaciones' && newItem.children) {
          newItem.children = newItem.children.filter(child => child.label === 'Traspasos');
        }

        if (newItem.label === 'Configuración' && newItem.children) {
          newItem.children = newItem.children.filter(child => child.label === 'Clientes');
        }

        return newItem;
      });
    } else {
      this.menuItems = [...this.allMenuItems];
    }
  }

  toggleSubmenu(item: MenuItem): void {
    if (this.isCollapsed) {
      this.sidebarService.setCollapsed(false);
      setTimeout(() => {
        if (item.children) {
          item.isOpen = !item.isOpen;
        }
      }, 100);
    } else {
      if (item.children) {
        item.isOpen = !item.isOpen;
      }
    }
  }

  toggleSidebar() {
    this.sidebarService.toggle();
  }
}
