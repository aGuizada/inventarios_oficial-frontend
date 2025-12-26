import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cotizacion, Venta, ApiResponse, PaginatedResponse, PaginationParams } from '../interfaces';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class CotizacionService {
    private apiUrl = `${environment.apiUrl}/cotizaciones`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<Cotizacion[]> {
        return this.http.get<Cotizacion[]>(this.apiUrl);
    }

    getPaginated(params?: PaginationParams): Observable<ApiResponse<PaginatedResponse<Cotizacion>>> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach(key => {
                const value = (params as any)[key];
                if (value !== undefined && value !== null) {
                    httpParams = httpParams.set(key, value.toString());
                }
            });
        }
        return this.http.get<ApiResponse<PaginatedResponse<Cotizacion>>>(this.apiUrl, { params: httpParams });
    }

    getById(id: number): Observable<Cotizacion> {
        return this.http.get<Cotizacion>(`${this.apiUrl}/${id}`);
    }

    create(cotizacion: Partial<Cotizacion>): Observable<Cotizacion> {
        return this.http.post<Cotizacion>(this.apiUrl, cotizacion);
    }

    update(id: number, cotizacion: Partial<Cotizacion>): Observable<Cotizacion> {
        return this.http.put<Cotizacion>(`${this.apiUrl}/${id}`, cotizacion);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    convertirAVenta(id: number): Observable<ApiResponse<Venta>> {
        return this.http.post<ApiResponse<Venta>>(`${this.apiUrl}/${id}/convertir`, {});
    }

    generarProformaPDF(id: number): void {
        const token = localStorage.getItem('token');
        
        if (!token) {
            alert('No hay token de autenticación. Por favor, inicie sesión nuevamente.');
            window.location.href = '/login';
            return;
        }

        const url = `${this.apiUrl}/${id}/proforma-pdf`;

        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.setRequestHeader('Accept', 'application/pdf');
        xhr.responseType = 'blob';

        xhr.onload = function() {
            if (xhr.status === 200) {
                const blob = xhr.response;
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `proforma_${id}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            } else if (xhr.status === 401) {
                alert('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
                window.location.href = '/login';
            } else {
                const reader = new FileReader();
                reader.onload = function() {
                    try {
                        const errorData = JSON.parse(reader.result as string);
                        alert('Error al generar el PDF: ' + (errorData.message || 'Error desconocido'));
                    } catch (e) {
                        alert('Error al generar el PDF. Por favor, intente nuevamente.');
                    }
                };
                reader.readAsText(xhr.response);
            }
        };

        xhr.onerror = function() {
            alert('Error de conexión al descargar el PDF. Por favor, verifique su conexión a internet.');
        };

        xhr.send();
    }
}
