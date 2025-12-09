import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfiguracionTrabajo, ApiResponse } from '../interfaces';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ConfiguracionTrabajoService {
    private apiUrl = `${environment.apiUrl}/configuracion-trabajo`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<ApiResponse<ConfiguracionTrabajo[]>> {
        return this.http.get<ApiResponse<ConfiguracionTrabajo[]>>(this.apiUrl);
    }

    getByClave(clave: string): Observable<ApiResponse<ConfiguracionTrabajo>> {
        return this.http.get<ApiResponse<ConfiguracionTrabajo>>(`${this.apiUrl}/clave/${clave}`);
    }

    update(id: number, configuracion: Partial<ConfiguracionTrabajo>): Observable<ApiResponse<ConfiguracionTrabajo>> {
        return this.http.put<ApiResponse<ConfiguracionTrabajo>>(`${this.apiUrl}/${id}`, configuracion);
    }
}
