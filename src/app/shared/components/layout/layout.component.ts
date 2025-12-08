import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { inject } from '@angular/core';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, NavbarComponent],
  templateUrl: './layout.component.html',
})
export class LayoutComponent implements OnInit, AfterViewInit {
  private document = inject(DOCUMENT);
  isDarkMode = false;

  ngOnInit(): void {
    // Cargar preferencia de modo oscuro desde localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      this.enableDarkMode();
    } else {
      this.disableDarkMode();
    }
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
