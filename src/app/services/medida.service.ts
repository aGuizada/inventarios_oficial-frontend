import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Medida, ApiResponse } from '../interfaces';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class MedidaService {
    private apiUrl = `${environment.apiUrl}/medidas`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<ApiResponse<Medida[]>> {
        return this.http.get<ApiResponse<Medida[]>>(this.apiUrl);
    }

    create(medida: Partial<Medida>): Observable<ApiResponse<Medida>> {
        return this.http.post<ApiResponse<Medida>>(this.apiUrl, medida);
    }

    update(id: number, medida: Partial<Medida>): Observable<ApiResponse<Medida>> {
        return this.http.put<ApiResponse<Medida>>(`${this.apiUrl}/${id}`, medida);
    }

    delete(id: number): Observable<ApiResponse<any>> {
        return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
    }
}
