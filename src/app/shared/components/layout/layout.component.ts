import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { inject } from '@angular/core';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, NavbarComponent],
  templateUrl: './layout.component.html',
})
export class LayoutComponent implements OnInit, AfterViewInit {
  private document = inject(DOCUMENT);
  private router = inject(Router);
  isDarkMode = false;
  isNoPaddingRoute = false;

  ngOnInit(): void {
    // Cargar preferencia de modo oscuro desde localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      this.enableDarkMode();
    } else {
      this.disableDarkMode();
    }

    // Detectar rutas que no deben tener padding
    this.checkRoute(this.router.url);

    // Escuchar cambios de ruta
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.checkRoute(event.url);
    });
  }

  private checkRoute(url: string): void {
    // Rutas que no deben tener padding (todas excepto dashboard)
    const noPaddingRoutes = [
      '/perfil',
      '/inventario',
      '/ventas',
      '/compras',
      '/finanzas',
      '/operaciones',
      '/config'
    ];
    this.isNoPaddingRoute = noPaddingRoutes.some(route => url.includes(route));
  }

  ngAfterViewInit(): void {
    // Escuchar eventos de toggle desde el navbar
    const layoutElement = this.document.querySelector('app-layout');
    if (layoutElement) {
      layoutElement.addEventListener('toggleDarkMode', () => {
        this.toggleDarkMode();
      });
    }
  }

  enableDarkMode(): void {
    this.document.documentElement.classList.add('dark');
    this.isDarkMode = true;
    localStorage.setItem('theme', 'dark');
  }

  disableDarkMode(): void {
    this.document.documentElement.classList.remove('dark');
    this.isDarkMode = false;
    localStorage.setItem('theme', 'light');
  }

  toggleDarkMode(): void {
    if (this.isDarkMode) {
      this.disableDarkMode();
    } else {
      this.enableDarkMode();
    }
  }
}
