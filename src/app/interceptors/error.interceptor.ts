import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { SweetAlertService } from '../services/sweet-alert.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const sweetAlert = inject(SweetAlertService);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            // Ignore 401 because authInterceptor handles it (redirects to login)
            if (error.status === 401) {
                return throwError(() => error);
            }

            // Ignore errors from notification endpoints (they're optional)
            if (req.url.includes('/notificaciones')) {
                return throwError(() => error);
            }

            let errorMessage = 'Ocurrió un error inesperado';

            if (error.error instanceof ErrorEvent) {
                // Client-side error
                errorMessage = error.error.message;
            } else {
                // Server-side error
                if (error.status === 403) {
                    sweetAlert.error('Acceso denegado', 'No tiene permisos para realizar esta acción');
                    return throwError(() => error);
                }

                if (error.status === 422) {
                    // Validation error
                    errorMessage = error.error.message || 'Error de validación';
                    if (error.error.errors) {
                        // Format validation errors
                        const errors = Object.values(error.error.errors).flat().join('\n');
                        sweetAlert.error('Error de validación', errors);
                        return throwError(() => error);
                    }
                }

                errorMessage = error.error?.message || error.message || 'Error desconocido';
            }

            sweetAlert.error('Error', errorMessage);
            return throwError(() => error);
        })
    );
};
