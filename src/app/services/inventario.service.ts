import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Inventario, ApiResponse, PaginatedResponse, PaginationParams } from '../interfaces';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class InventarioService {
    private apiUrl = `${environment.apiUrl}/inventarios`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<Inventario[]> {
        return this.http.get<Inventario[]>(this.apiUrl);
    }

    getPaginated(params?: PaginationParams): Observable<ApiResponse<PaginatedResponse<Inventario>>> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach(key => {
                const value = (params as any)[key];
                if (value !== undefined && value !== null) {
                    httpParams = httpParams.set(key, value.toString());
                }
            });
        }
        return this.http.get<ApiResponse<PaginatedResponse<Inventario>>>(this.apiUrl, { params: httpParams });
    }

    getByAlmacen(almacenId: number): Observable<Inventario[]> {
        return this.http.get<Inventario[]>(`${this.apiUrl}?almacen_id=${almacenId}`);
    }

    search(term: string): Observable<ApiResponse<Inventario[]>> {
        return this.http.get<ApiResponse<Inventario[]>>(`${this.apiUrl}/search`, {
            params: { q: term }
        });
    }

    /**
     * Obtiene inventario agrupado por ítem (artículo)
     */
    getPorItem(params?: any): Observable<any> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach(key => {
                const value = (params as any)[key];
                if (value !== undefined && value !== null) {
                    httpParams = httpParams.set(key, value.toString());
                }
            });
        }
        return this.http.get(`${this.apiUrl}/por-item`, { params: httpParams });
    }

    /**
     * Obtiene inventario detallado por lotes
     */
    getPorLotes(params?: any): Observable<any> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach(key => {
                const value = (params as any)[key];
                if (value !== undefined && value !== null) {
                    httpParams = httpParams.set(key, value.toString());
                }
            });
        }
        return this.http.get(`${this.apiUrl}/por-lotes`, { params: httpParams });
    }

    getById(id: number): Observable<Inventario> {
        return this.http.get<Inventario>(`${this.apiUrl}/${id}`);
    }
    exportExcel(): void {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('No hay token de autenticación. Por favor, inicie sesión nuevamente.');
            window.location.href = '/login';
            return;
        }

        const url = `${this.apiUrl}/export-excel`;

        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.responseType = 'blob';

        xhr.onload = function() {
            if (xhr.status === 200) {
                const contentType = xhr.getResponseHeader('Content-Type');
                if (contentType && (contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') || contentType.includes('application/vnd.ms-excel'))) {
                    const blob = xhr.response;
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'inventario.xlsx';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                } else {
                    const reader = new FileReader();
                    reader.onload = function() {
                        try {
                            const errorData = JSON.parse(reader.result as string);
                            alert('Error al generar el Excel: ' + (errorData.message || 'Error desconocido'));
                        } catch (e) {
                            alert('Error al generar el Excel. Por favor, intente nuevamente.');
                        }
                    };
                    reader.readAsText(xhr.response);
                }
            } else if (xhr.status === 401) {
                alert('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
                window.location.href = '/login';
            } else {
                alert('Error al descargar el Excel. Código de error: ' + xhr.status);
            }
        };
        xhr.onerror = function() {
            alert('Error de conexión al descargar el Excel.');
        };
        xhr.send();
    }

    exportPDF(): void {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('No hay token de autenticación. Por favor, inicie sesión nuevamente.');
            window.location.href = '/login';
            return;
        }

        const url = `${this.apiUrl}/export-pdf`;

        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.setRequestHeader('Accept', 'application/pdf');
        xhr.responseType = 'blob';

        xhr.onload = function() {
            if (xhr.status === 200) {
                const contentType = xhr.getResponseHeader('Content-Type');
                if (contentType && contentType.includes('application/pdf')) {
                    const blob = xhr.response;
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'inventario.pdf';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
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
            } else if (xhr.status === 401) {
                alert('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
                window.location.href = '/login';
            } else {
                alert('Error al descargar el PDF. Código de error: ' + xhr.status);
            }
        };
        xhr.onerror = function() {
            alert('Error de conexión al descargar el PDF.');
        };
        xhr.send();
    }

    /**
     * Descarga la plantilla de importación de inventario
     */
    downloadTemplate(): void {
        const token = localStorage.getItem('token');
        
        if (!token) {
            alert('No hay token de autenticación. Por favor, inicie sesión nuevamente.');
            window.location.href = '/login';
            return;
        }

        const url = `${this.apiUrl}/template/download`;

        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.responseType = 'blob';

        xhr.onload = function() {
            if (xhr.status === 200) {
                const contentType = xhr.getResponseHeader('Content-Type');
                if (contentType && (contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') || contentType.includes('application/vnd.ms-excel'))) {
                    const blob = xhr.response;
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'plantilla_inventario.xlsx';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                } else {
                    const reader = new FileReader();
                    reader.onload = function() {
                        try {
                            const errorData = JSON.parse(reader.result as string);
                            alert('Error al descargar la plantilla: ' + (errorData.message || 'Error desconocido'));
                        } catch (e) {
                            alert('Error al descargar la plantilla. Por favor, intente nuevamente.');
                        }
                    };
                    reader.readAsText(xhr.response);
                }
            } else if (xhr.status === 401) {
                alert('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
                window.location.href = '/login';
            } else {
                alert('Error al descargar la plantilla. Código de error: ' + xhr.status);
            }
        };

        xhr.onerror = function() {
            alert('Error de conexión al descargar la plantilla.');
        };

        xhr.send();
    }

    /**
     * Importa inventario desde un archivo Excel
     */
    importInventario(file: File): Observable<any> {
        const token = localStorage.getItem('token');
        
        if (!token) {
            console.error('No hay token de autenticación');
            return new Observable(observer => {
                observer.error({
                    error: {
                        message: 'No hay token de autenticación. Por favor, inicie sesión nuevamente.',
                        error: 'Unauthenticated'
                    }
                });
            });
        }

        const formData = new FormData();
        formData.append('file', file);

        // Usar HttpClient con headers explícitos para asegurar que el token se envíe
        const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`
            // No establecer Content-Type, el navegador lo hará automáticamente para FormData
        });

        return this.http.post(`${this.apiUrl}/import`, formData, { headers });
    }
}
