import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ConfiguracionTrabajoService } from './configuracion-trabajo.service';
import { MonedaService } from './moneda.service';
import { Moneda } from '../interfaces/moneda.interface';

@Injectable({
  providedIn: 'root'
})
export class MonedaActivaService {
  private monedaActiva$ = new BehaviorSubject<Moneda | null>(null);
  private simboloPorDefecto = 'Bs.'; // Símbolo por defecto si no hay moneda configurada

  constructor(
    private configuracionService: ConfiguracionTrabajoService,
    private monedaService: MonedaService
  ) {
    this.cargarMonedaActiva();
  }

  /**
   * Carga la moneda activa desde la configuración de trabajo
   * Método público para poder recargar cuando cambie la configuración
   */
  cargarMonedaActiva(): void {
    this.configuracionService.getAll().subscribe({
      next: (response) => {
        if (response.success && response.data && response.data.length > 0) {
          // Buscar la configuración que tenga moneda_principal
          const config = response.data.find((c: any) => c.moneda_principal);
          
          if (config && config.moneda_principal) {
            // Usar directamente la moneda_principal que viene en la relación
            this.monedaActiva$.next(config.moneda_principal);
          } else {
            // Si no hay moneda_principal configurada, buscar por moneda_principal_id
            const configConId = response.data.find((c: any) => c.moneda_principal_id);
            if (configConId && configConId.moneda_principal_id) {
              this.monedaService.getById(configConId.moneda_principal_id).subscribe({
                next: (monedaResponse) => {
                  if (monedaResponse.success && monedaResponse.data) {
                    this.monedaActiva$.next(monedaResponse.data);
                  } else {
                    this.obtenerMonedaPorDefecto();
                  }
                },
                error: () => {
                  this.obtenerMonedaPorDefecto();
                }
              });
            } else {
              this.obtenerMonedaPorDefecto();
            }
          }
        } else {
          this.obtenerMonedaPorDefecto();
        }
      },
      error: () => {
        this.obtenerMonedaPorDefecto();
      }
    });
  }

  /**
   * Obtiene la primera moneda activa como fallback
   */
  private obtenerMonedaPorDefecto(): void {
    this.monedaService.getAll().subscribe({
      next: (response) => {
        if (response.success && response.data && response.data.length > 0) {
          const monedaActiva = response.data.find((m: Moneda) => m.estado) || response.data[0];
          this.monedaActiva$.next(monedaActiva);
        }
      },
      error: () => {
        // Si todo falla, usar un objeto por defecto
        this.monedaActiva$.next({
          id: 0,
          empresa_id: 0,
          nombre: 'Boliviano',
          simbolo: this.simboloPorDefecto,
          tipo_cambio: 1,
          estado: true
        } as Moneda);
      }
    });
  }

  /**
   * Obtiene el símbolo de la moneda activa
   */
  getSimbolo(): string {
    const moneda = this.monedaActiva$.value;
    return moneda?.simbolo || this.simboloPorDefecto;
  }

  /**
   * Obtiene la moneda activa como Observable
   */
  getMonedaActiva(): Observable<Moneda | null> {
    return this.monedaActiva$.asObservable();
  }

  /**
   * Obtiene el símbolo como Observable
   */
  getSimboloObservable(): Observable<string> {
    return this.monedaActiva$.pipe(
      map(moneda => moneda?.simbolo || this.simboloPorDefecto)
    );
  }

  /**
   * Formatea un valor numérico con el símbolo de la moneda
   */
  formatearMoneda(valor: number | string | null | undefined): string {
    if (valor === null || valor === undefined) {
      return `${this.getSimbolo()} 0.00`;
    }
    
    const numValor = typeof valor === 'string' ? parseFloat(valor) : valor;
    
    if (isNaN(numValor)) {
      return `${this.getSimbolo()} 0.00`;
    }

    return `${this.getSimbolo()} ${numValor.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  }
}

