import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Caja, ApiResponse, PaginatedResponse, PaginationParams } from '../interfaces';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class CajaService {
    private apiUrl = `${environment.apiUrl}/cajas`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<ApiResponse<Caja[]>> {
        return this.http.get<ApiResponse<Caja[]>>(this.apiUrl);
    }

    getPaginated(params?: PaginationParams): Observable<ApiResponse<PaginatedResponse<Caja>>> {
        let httpParams = new HttpParams();

        if (params?.page) {
            httpParams = httpParams.set('page', params.page.toString());
        }
        if (params?.per_page) {
            httpParams = httpParams.set('per_page', params.per_page.toString());
        }
        if (params?.search) {
            httpParams = httpParams.set('search', params.search);
        }
        if (params?.sort_by) {
            httpParams = httpParams.set('sort_by', params.sort_by);
        }
        if (params?.sort_order) {
            httpParams = httpParams.set('sort_order', params.sort_order);
        }

        return this.http.get<ApiResponse<PaginatedResponse<Caja>>>(this.apiUrl, { params: httpParams });
    }

    getById(id: number): Observable<ApiResponse<Caja>> {
        return this.http.get<ApiResponse<Caja>>(`${this.apiUrl}/${id}`);
    }

    create(caja: Partial<Caja>): Observable<ApiResponse<Caja>> {
        return this.http.post<ApiResponse<Caja>>(this.apiUrl, caja);
    }

    update(id: number, caja: Partial<Caja>): Observable<ApiResponse<Caja>> {
        return this.http.put<ApiResponse<Caja>>(`${this.apiUrl}/${id}`, caja);
    }

    getCajaDetails(id: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${id}/details`);
    }

    abrir(id: number, saldoInicial: number): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${this.apiUrl}/${id}/abrir`, { saldo_inicial: saldoInicial });
    }

    cerrar(id: number): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${this.apiUrl}/${id}/cerrar`, {});
    }
}
