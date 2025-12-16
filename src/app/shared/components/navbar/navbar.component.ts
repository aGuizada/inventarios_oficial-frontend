import { Component, OnInit, inject, effect, OnDestroy } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { SidebarService } from '../../../services/sidebar.service';
import { NotificationService } from '../../../services/notification.service';
import { SweetAlertService } from '../../../services/sweet-alert.service';
import { Notification } from '../../../interfaces/notification.interface';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent implements OnInit, OnDestroy {
  private document = inject(DOCUMENT);
  user$;
  showProfileMenu = false;
  showNotifications = false;
  isDarkMode = false;
  isFullscreen = false;

  notifications: Notification[] = [];
  unreadCount = 0;
  private previousUnreadCount = 0; // Para detectar nuevas notificaciones
  private notificationInterval: any;

  constructor(
    private authService: AuthService,
    private sidebarService: SidebarService,
    private notificationService: NotificationService,
    private sweetAlertService: SweetAlertService,
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

    // Cargar notificaciones inicialmente
    this.loadNotifications(true); // true = primera carga, no mostrar toast

    // Actualizar notificaciones cada 15 segundos (más frecuente para ser más reactivo)
    this.notificationInterval = setInterval(() => {
      this.loadNotifications(false); // false = polling, sí mostrar toast si hay nuevas
    }, 15000);
  }

  ngOnDestroy(): void {
    if (this.notificationInterval) {
      clearInterval(this.notificationInterval);
    }
  }

  loadNotifications(isInitialLoad: boolean = false): void {
    this.notificationService.getNoLeidas().subscribe({
      next: (response) => {
        if (response.success) {
          const newNotifications = response.data;
          const newCount = newNotifications.length;

          // Si hay nuevas notificaciones (y no es la carga inicial)
          if (!isInitialLoad && newCount > this.previousUnreadCount && newCount > 0) {
            const newNotificationsCount = newCount - this.previousUnreadCount;
            const latestNotification = newNotifications[0]; // La más reciente

            // Mostrar toast con la última notificación
            this.sweetAlertService.notification(
              latestNotification.titulo,
              latestNotification.mensaje,
              newNotificationsCount
            );

            // Reproducir sonido de notificación (opcional)
            this.playNotificationSound();
          }

          // Actualizar estado
          this.notifications = newNotifications;
          this.unreadCount = newCount;
          this.previousUnreadCount = newCount;
        }
      },
      error: (err) => {
        // Silently fail - don't show errors for notifications
        console.log('Could not load notifications', err);
        this.notifications = [];
        this.unreadCount = 0;
      }
    });
  }

  /**
   * Reproduce un sonido breve para alertar sobre nueva notificación
   */
  playNotificationSound(): void {
    try {
      // Crear un AudioContext para generar un sonido simple
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800; // Frecuencia del tono
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (e) {
      // Si falla el sonido, no importa
      console.log('Could not play notification sound', e);
    }
  }

  toggleSidebar(): void {
    this.sidebarService.toggle();
  }

  toggleProfileMenu(): void {
    this.showProfileMenu = !this.showProfileMenu;
    if (this.showProfileMenu) {
      this.showNotifications = false;
    }
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.showProfileMenu = false;
    }
  }

  markAsRead(notification: Notification): void {
    this.notificationService.marcarComoLeida(notification.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadNotifications();
        }
      }
    });
  }

  markAllAsRead(): void {
    if (this.unreadCount === 0) return;

    this.notificationService.marcarTodasComoLeidas().subscribe({
      next: (response) => {
        if (response.success) {
          this.loadNotifications();
          this.sweetAlertService.success('Hecho', 'Todas las notificaciones marcadas como leídas');
        }
      }
    });
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
