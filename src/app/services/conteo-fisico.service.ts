import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ConteoFisico {
    id?: number;
    almacen_id: number;
    fecha_conteo: string;
    responsable: string;
    estado: string;
    observaciones?: string;
    usuario_id?: number;
    almacen?: any;
    detalles?: DetalleConteoFisico[];
}

export interface DetalleConteoFisico {
    id?: number;
    conteo_fisico_id?: number;
    articulo_id: number;
    cantidad_sistema: number;
    cantidad_contada: number | null;
    diferencia: number;
    costo_unitario: number;
    articulo?: any;
}

@Injectable({
    providedIn: 'root'
})
export class ConteoFisicoService {
    private apiUrl = `${environment.apiUrl}/conteos-fisicos`;

    constructor(private http: HttpClient) { }

    getAll(params?: any): Observable<any> {
        return this.http.get<any>(this.apiUrl, { params });
    }

    getById(id: number): Observable<{ success: boolean; data: ConteoFisico }> {
        return this.http.get<{ success: boolean; data: ConteoFisico }>(`${this.apiUrl}/${id}`);
    }

    create(conteo: any): Observable<{ success: boolean; data: ConteoFisico; message: string }> {
        return this.http.post<{ success: boolean; data: ConteoFisico; message: string }>(this.apiUrl, conteo);
    }

    update(id: number, detalles: any): Observable<{ success: boolean; data: ConteoFisico; message: string }> {
        return this.http.put<{ success: boolean; data: ConteoFisico; message: string }>(`${this.apiUrl}/${id}`, { detalles });
    }

    generarAjustes(id: number): Observable<{ success: boolean; message: string }> {
        return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/${id}/generar-ajustes`, {});
    }
}
