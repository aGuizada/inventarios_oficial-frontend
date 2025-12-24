import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
    providedIn: 'root'
})
export class SweetAlertService {

    constructor() { }

    // Toast para mensajes generales (3 segundos)
    private toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });

    // Toast para advertencias y errores (6 segundos, más visible)
    private alertToast = Swal.mixin({
        toast: true,
        position: 'top',
        showConfirmButton: false,
        timer: 6000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        },
        customClass: {
            popup: 'swal2-toast-large'
        }
    });

    success(title: string, text?: string) {
        try {
            if (typeof document !== 'undefined' && document.body) {
                this.toast.fire({
                    icon: 'success',
                    title: title,
                    text: text
                });
            }
        } catch (error) {
            // Silenciar errores si el DOM no está listo
        }
    }

    error(title: string, text?: string) {
        try {
            if (typeof document !== 'undefined' && document.body) {
                // Errores usan el toast más visible y duran más
                this.alertToast.fire({
                    icon: 'error',
                    title: title,
                    text: text
                });
            }
        } catch (error) {
            // Silenciar errores si el DOM no está listo
        }
    }

    warning(title: string, text?: string) {
        try {
            if (typeof document !== 'undefined' && document.body) {
                // Warnings usan el toast más visible y duran más
                this.alertToast.fire({
                    icon: 'warning',
                    title: title,
                    text: text
                });
            }
        } catch (error) {
            // Silenciar errores si el DOM no está listo
        }
    }

    info(title: string, text?: string) {
        try {
            if (typeof document !== 'undefined' && document.body) {
                this.toast.fire({
                    icon: 'info',
                    title: title,
                    text: text
                });
            }
        } catch (error) {
            // Silenciar errores si el DOM no está listo
        }
    }

    /**
     * Toast especial para notificaciones del sistema
     * Aparece en el centro superior y tiene un botón para ver más
     */
    notification(title: string, message: string, count: number = 1) {
        // Usar setTimeout para asegurar que el DOM esté completamente listo
        setTimeout(() => {
            try {
                // Verificar que el documento esté listo
                if (typeof document !== 'undefined' && document.body) {
                    Swal.fire({
                        toast: false, // Cambiar a false para permitir botones
                        position: 'top',
                        icon: 'info',
                        title: title,
                        html: `${message}<br><small class="text-muted">${count > 1 ? `+${count - 1} más` : ''}</small>`,
                        showConfirmButton: true,
                        confirmButtonText: 'Ver Todas',
                        showCancelButton: true,
                        cancelButtonText: 'Cerrar',
                        timer: 8000,
                        timerProgressBar: true,
                        allowOutsideClick: true,
                        allowEscapeKey: true,
                        customClass: {
                            confirmButton: 'swal2-confirm swal2-styled',
                            cancelButton: 'swal2-cancel swal2-styled'
                        }
                    }).then((result) => {
                        if (result.isConfirmed) {
                            // Navegar a la página de notificaciones
                            window.location.href = '/notificaciones';
                        }
                    }).catch(() => {
                        // Silenciar errores de SweetAlert2
                    });
                }
            } catch (error) {
                // Silenciar errores si el DOM no está listo
            }
        }, 100);
    }

    confirm(title: string, text: string, confirmButtonText: string = 'Sí, continuar'): Promise<any> {
        try {
            if (typeof document !== 'undefined' && document.body) {
                return Swal.fire({
                    title: title,
                    text: text,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: confirmButtonText,
                    cancelButtonText: 'Cancelar'
                });
            }
        } catch (error) {
            // Retornar una promesa rechazada si hay error
        }
        return Promise.reject('DOM no está listo');
    }
}
