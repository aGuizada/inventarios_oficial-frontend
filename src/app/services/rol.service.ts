import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Rol, ApiResponse, PaginatedResponse, PaginationParams } from '../interfaces';
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

    getPaginated(params?: PaginationParams): Observable<ApiResponse<PaginatedResponse<Rol>>> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach(key => {
                const value = (params as any)[key];
                if (value !== undefined && value !== null) {
                    httpParams = httpParams.set(key, value.toString());
                }
            });
        }
        return this.http.get<ApiResponse<PaginatedResponse<Rol>>>(this.apiUrl, { params: httpParams });
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
