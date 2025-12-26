import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cliente, ApiResponse, PaginatedResponse, PaginationParams } from '../interfaces';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ClienteService {
    private apiUrl = `${environment.apiUrl}/clientes`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<ApiResponse<Cliente[]>> {
        return this.http.get<ApiResponse<Cliente[]>>(this.apiUrl);
    }

    getPaginated(params?: PaginationParams): Observable<ApiResponse<PaginatedResponse<Cliente>>> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach(key => {
                const value = (params as any)[key];
                if (value !== undefined && value !== null) {
                    httpParams = httpParams.set(key, value.toString());
                }
            });
        }
        return this.http.get<ApiResponse<PaginatedResponse<Cliente>>>(this.apiUrl, { params: httpParams });
    }

    getById(id: number): Observable<ApiResponse<Cliente>> {
        return this.http.get<ApiResponse<Cliente>>(`${this.apiUrl}/${id}`);
    }

    create(cliente: Partial<Cliente>): Observable<ApiResponse<Cliente>> {
        return this.http.post<ApiResponse<Cliente>>(this.apiUrl, cliente);
    }

    update(id: number, cliente: Partial<Cliente>): Observable<ApiResponse<Cliente>> {
        return this.http.put<ApiResponse<Cliente>>(`${this.apiUrl}/${id}`, cliente);
    }

    delete(id: number): Observable<ApiResponse<any>> {
        return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
    }

    search(term: string): Observable<ApiResponse<Cliente[]>> {
        return this.http.get<ApiResponse<Cliente[]>>(`${this.apiUrl}/search`, {
            params: { q: term }
        });
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
                    link.download = 'clientes.xlsx';
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
                    link.download = 'clientes.pdf';
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
}
