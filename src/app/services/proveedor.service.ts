import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Proveedor, ApiResponse, PaginatedResponse, PaginationParams } from '../interfaces';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ProveedorService {
    private apiUrl = `${environment.apiUrl}/proveedores`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<ApiResponse<Proveedor[]>> {
        return this.http.get<ApiResponse<Proveedor[]>>(this.apiUrl);
    }

    getPaginated(params?: PaginationParams): Observable<ApiResponse<PaginatedResponse<Proveedor>>> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach(key => {
                const value = (params as any)[key];
                if (value !== undefined && value !== null) {
                    httpParams = httpParams.set(key, value.toString());
                }
            });
        }
        return this.http.get<ApiResponse<PaginatedResponse<Proveedor>>>(this.apiUrl, { params: httpParams });
    }

    getById(id: number): Observable<ApiResponse<Proveedor>> {
        return this.http.get<ApiResponse<Proveedor>>(`${this.apiUrl}/${id}`);
    }

    create(proveedor: Partial<Proveedor>): Observable<ApiResponse<Proveedor>> {
        return this.http.post<ApiResponse<Proveedor>>(this.apiUrl, proveedor);
    }

    update(id: number, proveedor: Partial<Proveedor>): Observable<ApiResponse<Proveedor>> {
        return this.http.put<ApiResponse<Proveedor>>(`${this.apiUrl}/${id}`, proveedor);
    }

    delete(id: number): Observable<ApiResponse<any>> {
        return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
    }

    search(term: string): Observable<ApiResponse<Proveedor[]>> {
        return this.http.get<ApiResponse<Proveedor[]>>(`${this.apiUrl}/search`, {
            params: { q: term }
        });
    }

    /**
     * Descarga la plantilla Excel para importar proveedores
     */
    downloadTemplate(): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/template/download`, {
            responseType: 'blob'
        });
    }

    /**
     * Importa proveedores desde un archivo Excel
     */
    importFromExcel(file: File): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post(`${this.apiUrl}/import`, formData);
    }
    exportExcel(): void {
        window.open(`${this.apiUrl}/export-excel`, '_blank');
    }

    exportPDF(): void {
        window.open(`${this.apiUrl}/export-pdf`, '_blank');
    }
}
