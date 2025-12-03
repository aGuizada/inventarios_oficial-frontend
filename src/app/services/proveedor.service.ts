import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Proveedor, ApiResponse } from '../interfaces';
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
}
