import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/notification.service';
import { SweetAlertService } from '../../services/sweet-alert.service';
import { Notification } from '../../interfaces/notification.interface';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, PaginationComponent],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit {
  notifications: Notification[] = [];
  isLoading = false;

  // Pagination
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  itemsPerPage = 20;

  constructor(
    private notificationService: NotificationService,
    private sweetAlert: SweetAlertService
  ) { }

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(page: number = 1): void {
    this.isLoading = true;
    this.notificationService.getAll(page).subscribe({
      next: (response) => {
        if (response.success) {
          this.notifications = response.data;
          // Handle pagination metadata if available in response
          if ((response as any).meta) {
            this.currentPage = (response as any).meta.current_page;
            this.totalPages = (response as any).meta.last_page;
            this.totalItems = (response as any).meta.total;
          }
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading notifications', err);
        this.isLoading = false;
      }
    });
  }

  onPageChange(page: number): void {
    this.loadNotifications(page);
  }

  markAsRead(notification: Notification): void {
    if (notification.leido) return;

    this.notificationService.marcarComoLeida(notification.id).subscribe({
      next: (response) => {
        if (response.success) {
          notification.leido = true;
        }
      }
    });
  }

  markAllAsRead(): void {
    this.sweetAlert.confirm('¿Marcar todas como leídas?', 'Esto marcará todas tus notificaciones como leídas.')
      .then((result) => {
        if (result.isConfirmed) {
          this.notificationService.marcarTodasComoLeidas().subscribe({
            next: (response) => {
              if (response.success) {
                this.loadNotifications(this.currentPage);
                this.sweetAlert.success('Hecho', 'Todas las notificaciones marcadas como leídas');
              }
            }
          });
        }
      });
  }

  deleteNotification(id: string): void {
    this.sweetAlert.confirm('¿Eliminar notificación?', 'Esta acción no se puede deshacer.')
      .then((result) => {
        if (result.isConfirmed) {
          this.notificationService.delete(id).subscribe({
            next: (response) => {
              if (response.success) {
                this.loadNotifications(this.currentPage);
                this.sweetAlert.success('Eliminado', 'Notificación eliminada');
              }
            }
          });
        }
      });
  }
}
