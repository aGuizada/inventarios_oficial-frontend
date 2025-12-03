import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Rol, ApiResponse } from '../interfaces';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class RolService {
    private apiUrl = `${environment.apiUrl}/roles`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<ApiResponse<Rol[]>> {
        return this.http.get<ApiResponse<Rol[]>>(this.apiUrl);
    }

    create(rol: Partial<Rol>): Observable<ApiResponse<Rol>> {
        return this.http.post<ApiResponse<Rol>>(this.apiUrl, rol);
    }

    update(id: number, rol: Partial<Rol>): Observable<ApiResponse<Rol>> {
        return this.http.put<ApiResponse<Rol>>(`${this.apiUrl}/${id}`, rol);
    }

    delete(id: number): Observable<ApiResponse<any>> {
        return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
    }
}
