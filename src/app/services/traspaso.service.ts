import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Traspaso, ApiResponse } from '../interfaces';
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

    getById(id: number): Observable<ApiResponse<Traspaso>> {
        return this.http.get<ApiResponse<Traspaso>>(`${this.apiUrl}/${id}`);
    }

    create(traspaso: Partial<Traspaso>): Observable<ApiResponse<Traspaso>> {
        return this.http.post<ApiResponse<Traspaso>>(this.apiUrl, traspaso);
    }

    aprobar(id: number): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${this.apiUrl}/${id}/aprobar`, {});
    }

    rechazar(id: number, motivo: string): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${this.apiUrl}/${id}/rechazar`, { motivo });
    }
}
