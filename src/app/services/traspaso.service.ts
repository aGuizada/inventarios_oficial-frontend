import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Traspaso, ApiResponse, PaginatedResponse, PaginationParams } from '../interfaces';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class TraspasoService {
    private apiUrl = `${environment.apiUrl}/traspasos`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<ApiResponse<Traspaso[]>> {
        return this.http.get<ApiResponse<Traspaso[]>>(this.apiUrl);
    }

    getPaginated(params?: PaginationParams): Observable<ApiResponse<PaginatedResponse<Traspaso>>> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach(key => {
                const value = (params as any)[key];
                if (value !== undefined && value !== null) {
                    httpParams = httpParams.set(key, value.toString());
                }
            });
        }
        return this.http.get<ApiResponse<PaginatedResponse<Traspaso>>>(this.apiUrl, { params: httpParams });
    }

    getById(id: number): Observable<ApiResponse<Traspaso>> {
        return this.http.get<ApiResponse<Traspaso>>(`${this.apiUrl}/${id}`);
    }

    create(traspaso: Partial<Traspaso>): Observable<ApiResponse<Traspaso>> {
        return this.http.post<ApiResponse<Traspaso>>(this.apiUrl, traspaso);
    }

    aprobar(id: number): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${this.apiUrl}/${id}/aprobar`, {});
    }

    recibir(id: number): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${this.apiUrl}/${id}/recibir`, {});
    }

    rechazar(id: number, motivo: string): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${this.apiUrl}/${id}/rechazar`, { motivo });
    }

    update(id: number, traspaso: Partial<Traspaso>): Observable<ApiResponse<Traspaso>> {
        return this.http.put<ApiResponse<Traspaso>>(`${this.apiUrl}/${id}`, traspaso);
    }
}
