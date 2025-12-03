import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Sucursal, ApiResponse } from '../interfaces';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class SucursalService {
    private apiUrl = `${environment.apiUrl}/sucursales`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<ApiResponse<Sucursal[]>> {
        return this.http.get<ApiResponse<Sucursal[]>>(this.apiUrl);
    }

    getById(id: number): Observable<ApiResponse<Sucursal>> {
        return this.http.get<ApiResponse<Sucursal>>(`${this.apiUrl}/${id}`);
    }

    create(sucursal: Partial<Sucursal>): Observable<ApiResponse<Sucursal>> {
        return this.http.post<ApiResponse<Sucursal>>(this.apiUrl, sucursal);
    }

    update(id: number, sucursal: Partial<Sucursal>): Observable<ApiResponse<Sucursal>> {
        return this.http.put<ApiResponse<Sucursal>>(`${this.apiUrl}/${id}`, sucursal);
    }

    delete(id: number): Observable<ApiResponse<any>> {
        return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
    }
}
