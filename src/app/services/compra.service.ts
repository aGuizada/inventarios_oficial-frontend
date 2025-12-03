import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Compra, ApiResponse } from '../interfaces';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class CompraService {
    private apiUrl = `${environment.apiUrl}/compras`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<Compra[]> {
        return this.http.get<Compra[]>(this.apiUrl);
    }

    getById(id: number): Observable<Compra> {
        return this.http.get<Compra>(`${this.apiUrl}/${id}`);
    }

    create(compra: Partial<Compra>): Observable<Compra> {
        return this.http.post<Compra>(this.apiUrl, compra);
    }

    update(id: number, compra: Partial<Compra>): Observable<Compra> {
        return this.http.put<Compra>(`${this.apiUrl}/${id}`, compra);
    }

    delete(id: number): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/${id}`);
    }
}
