import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch, HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { inject, isDevMode } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { provideServiceWorker } from '@angular/service-worker';
import { errorInterceptor } from './interceptors/error.interceptor';

// Functional interceptor para agregar el token Bearer
const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  let authReq = req;
  if (token) {
    authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
  }

  return next(authReq).pipe(
    catchError((error) => {
      if (error.status === 401) {
        // Solo hacer logout si NO es un endpoint opcional
        const isOptionalEndpoint = req.url.includes('/notificaciones') ||
          req.url.includes('/users/') && req.method === 'GET';

        if (!isOptionalEndpoint) {
          console.log('401 Unauthorized on critical endpoint. Logging out...');
          authService.logout().subscribe();
          router.navigate(['/login']);
        } else {
          console.log('401 on optional endpoint. Ignoring...');
        }
      }
      return throwError(() => error);
    })
  );
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor, errorInterceptor])
    ),
    provideCharts(withDefaultRegisterables()), provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    })
  ]
};
