import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Marca, ApiResponse } from '../interfaces';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class MarcaService {
    private apiUrl = `${environment.apiUrl}/marcas`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<ApiResponse<Marca[]>> {
        return this.http.get<ApiResponse<Marca[]>>(this.apiUrl);
    }

    create(marca: Partial<Marca>): Observable<ApiResponse<Marca>> {
        return this.http.post<ApiResponse<Marca>>(this.apiUrl, marca);
    }

    update(id: number, marca: Partial<Marca>): Observable<ApiResponse<Marca>> {
        return this.http.put<ApiResponse<Marca>>(`${this.apiUrl}/${id}`, marca);
    }

    delete(id: number): Observable<ApiResponse<any>> {
        return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
    }
}
