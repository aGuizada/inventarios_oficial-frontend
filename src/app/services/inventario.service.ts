import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Inventario } from '../interfaces';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class InventarioService {
    private apiUrl = `${environment.apiUrl}/inventarios`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<Inventario[]> {
        return this.http.get<Inventario[]>(this.apiUrl);
    }

    getByAlmacen(almacenId: number): Observable<Inventario[]> {
        return this.http.get<Inventario[]>(`${this.apiUrl}?almacen_id=${almacenId}`);
    }

    getById(id: number): Observable<Inventario> {
        return this.http.get<Inventario>(`${this.apiUrl}/${id}`);
    }
}
