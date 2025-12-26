import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Articulo, ApiResponse, PaginatedResponse } from '../interfaces';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ArticuloService {
    private apiUrl = `${environment.apiUrl}/articulos`;

    constructor(private http: HttpClient) { }

    // Devuelve paginado cuando se envían page/per_page; el backend mantiene compatibilidad con array sin paginar si no se envían.
    getAll(page: number = 1, perPage: number = 10): Observable<ApiResponse<PaginatedResponse<Articulo> | Articulo[]>> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('per_page', perPage.toString());
        return this.http.get<ApiResponse<PaginatedResponse<Articulo> | Articulo[]>>(this.apiUrl, { params });
    }

    getAllPaginated(params?: { page?: number; per_page?: number; search?: string; sort_by?: string; sort_order?: 'asc' | 'desc' }): Observable<ApiResponse<PaginatedResponse<Articulo>>> {
        let httpParams = new HttpParams();

        if (params?.page) {
            httpParams = httpParams.set('page', params.page.toString());
        }
        if (params?.per_page) {
            httpParams = httpParams.set('per_page', params.per_page.toString());
        }
        if (params?.search) {
            httpParams = httpParams.set('search', params.search);
        }
        if (params?.sort_by) {
            httpParams = httpParams.set('sort_by', params.sort_by);
        }
        if (params?.sort_order) {
            httpParams = httpParams.set('sort_order', params.sort_order);
        }

        return this.http.get<ApiResponse<PaginatedResponse<Articulo>>>(this.apiUrl, { params: httpParams });
    }

    getById(id: number): Observable<ApiResponse<Articulo>> {
        return this.http.get<ApiResponse<Articulo>>(`${this.apiUrl}/${id}`);
    }

    create(articulo: Partial<Articulo> | FormData): Observable<ApiResponse<Articulo>> {
        return this.http.post<ApiResponse<Articulo>>(this.apiUrl, articulo);
    }

    update(id: number, articulo: Partial<Articulo> | FormData): Observable<ApiResponse<Articulo>> {
        if (articulo instanceof FormData) {
            articulo.append('_method', 'PUT');
            return this.http.post<ApiResponse<Articulo>>(`${this.apiUrl}/${id}`, articulo);
        }
        return this.http.put<ApiResponse<Articulo>>(`${this.apiUrl}/${id}`, articulo);
    }

    delete(id: number): Observable<ApiResponse<any>> {
        return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
    }

    search(term: string): Observable<ApiResponse<Articulo[]>> {
        return this.http.get<ApiResponse<Articulo[]>>(`${this.apiUrl}/search`, {
            params: { q: term }
        });
    }

    downloadTemplate(): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/template/download`, {
            responseType: 'blob'
        });
    }

    importFromExcel(file: File): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<any>(`${this.apiUrl}/import`, formData);
    }
    exportExcel(): void {
        // Get the token from localStorage
        const token = localStorage.getItem('token');
        
        if (!token) {
            alert('No hay token de autenticación. Por favor, inicie sesión nuevamente.');
            window.location.href = '/login';
            return;
        }
        
        // Create a GET request with the Authorization header
        const xhr = new XMLHttpRequest();
        xhr.open('GET', `${this.apiUrl}/export-excel`, true);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.setRequestHeader('Accept', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        xhr.responseType = 'blob'; // Important for Excel download
        
        xhr.onload = function() {
            if (xhr.status === 200) {
                // Check if response is actually an Excel file
                const contentType = xhr.getResponseHeader('Content-Type');
                if (contentType && (contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') || contentType.includes('application/octet-stream'))) {
                    // Success: download the Excel file
                    const blob = xhr.response;
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'articulos.xlsx';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                } else {
                    // Response is not an Excel file, might be an error JSON
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
                // Unauthorized: redirect to login
                alert('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
                window.location.href = '/login';
            } else if (xhr.status === 500) {
                // Server error
                const reader = new FileReader();
                reader.onload = function() {
                    try {
                        const errorData = JSON.parse(reader.result as string);
                        alert('Error del servidor: ' + (errorData.message || errorData.error || 'Error desconocido'));
                    } catch (e) {
                        alert('Error del servidor al generar el Excel. Por favor, intente nuevamente.');
                    }
                };
                reader.readAsText(xhr.response);
            } else {
                // Other error
                alert('Error al descargar el Excel. Código de error: ' + xhr.status);
                console.error('Error downloading Excel:', xhr.status, xhr.statusText);
            }
        };
        
        xhr.onerror = function() {
            alert('Error de conexión al descargar el Excel. Por favor, verifique su conexión a internet.');
            console.error('Network error downloading Excel');
        };
        
        xhr.send();
    }

    exportPDF(): void {
        // Get the token from localStorage
        const token = localStorage.getItem('token');
        
        if (!token) {
            alert('No hay token de autenticación. Por favor, inicie sesión nuevamente.');
            window.location.href = '/login';
            return;
        }
        
        // Create a GET request with the Authorization header
        const xhr = new XMLHttpRequest();
        xhr.open('GET', `${this.apiUrl}/export-pdf`, true);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.setRequestHeader('Accept', 'application/pdf');
        xhr.responseType = 'blob'; // Important for PDF download
        
        xhr.onload = function() {
            if (xhr.status === 200) {
                // Check if response is actually a PDF
                const contentType = xhr.getResponseHeader('Content-Type');
                if (contentType && contentType.includes('application/pdf')) {
                    // Success: download the PDF
                    const blob = xhr.response;
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'articulos.pdf';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                } else {
                    // Response is not a PDF, might be an error JSON
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
                // Unauthorized: redirect to login
                alert('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
                window.location.href = '/login';
            } else if (xhr.status === 500) {
                // Server error
                const reader = new FileReader();
                reader.onload = function() {
                    try {
                        const errorData = JSON.parse(reader.result as string);
                        alert('Error del servidor: ' + (errorData.message || errorData.error || 'Error desconocido'));
                    } catch (e) {
                        alert('Error del servidor al generar el PDF. Por favor, intente nuevamente.');
                    }
                };
                reader.readAsText(xhr.response);
            } else {
                // Other error
                alert('Error al descargar el PDF. Código de error: ' + xhr.status);
                console.error('Error downloading PDF:', xhr.status, xhr.statusText);
            }
        };
        
        xhr.onerror = function() {
            alert('Error de conexión al descargar el PDF. Por favor, verifique su conexión a internet.');
            console.error('Network error downloading PDF');
        };
        
        xhr.send();
    }
}
