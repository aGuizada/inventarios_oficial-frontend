import { Component, OnInit, inject, effect } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { SidebarService } from '../../../services/sidebar.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent implements OnInit {
  private document = inject(DOCUMENT);
  user$;
  showProfileMenu = false;
  isDarkMode = false;
  isFullscreen = false;

  constructor(
    private authService: AuthService,
    private sidebarService: SidebarService,
    private router: Router
  ) {
    this.user$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    // Verificar estado inicial del modo oscuro
    this.isDarkMode = this.document.documentElement.classList.contains('dark');

    // Escuchar cambios en el modo oscuro
    const observer = new MutationObserver(() => {
      this.isDarkMode = this.document.documentElement.classList.contains('dark');
    });
    observer.observe(this.document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    // Verificar estado inicial de pantalla completa
    this.checkFullscreen();

    // Escuchar cambios en pantalla completa
    this.document.addEventListener('fullscreenchange', () => this.checkFullscreen());
    this.document.addEventListener('webkitfullscreenchange', () => this.checkFullscreen());
    this.document.addEventListener('mozfullscreenchange', () => this.checkFullscreen());
    this.document.addEventListener('MSFullscreenChange', () => this.checkFullscreen());
  }

  toggleSidebar(): void {
    this.sidebarService.toggle();
  }

  toggleProfileMenu(): void {
    this.showProfileMenu = !this.showProfileMenu;
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login'])
    });
  }

  toggleDarkMode(): void {
    // Toggle directamente en el documento
    if (this.isDarkMode) {
      this.document.documentElement.classList.remove('dark');
      this.isDarkMode = false;
      localStorage.setItem('theme', 'light');
    } else {
      this.document.documentElement.classList.add('dark');
      this.isDarkMode = true;
      localStorage.setItem('theme', 'dark');
    }
  }

  toggleFullscreen(): void {
    if (!this.isFullscreen) {
      this.enterFullscreen();
    } else {
      this.exitFullscreen();
    }
  }

  enterFullscreen(): void {
    const element = this.document.documentElement;
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if ((element as any).webkitRequestFullscreen) {
      (element as any).webkitRequestFullscreen();
    } else if ((element as any).mozRequestFullScreen) {
      (element as any).mozRequestFullScreen();
    } else if ((element as any).msRequestFullscreen) {
      (element as any).msRequestFullscreen();
    }
  }

  exitFullscreen(): void {
    if (this.document.exitFullscreen) {
      this.document.exitFullscreen();
    } else if ((this.document as any).webkitExitFullscreen) {
      (this.document as any).webkitExitFullscreen();
    } else if ((this.document as any).mozCancelFullScreen) {
      (this.document as any).mozCancelFullScreen();
    } else if ((this.document as any).msExitFullscreen) {
      (this.document as any).msExitFullscreen();
    }
  }

  checkFullscreen(): void {
    this.isFullscreen = !!(
      this.document.fullscreenElement ||
      (this.document as any).webkitFullscreenElement ||
      (this.document as any).mozFullScreenElement ||
      (this.document as any).msFullscreenElement
    );
  }
}
