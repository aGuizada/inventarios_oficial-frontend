import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Industria, ApiResponse } from '../interfaces';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class IndustriaService {
    private apiUrl = `${environment.apiUrl}/industrias`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<ApiResponse<Industria[]>> {
        return this.http.get<ApiResponse<Industria[]>>(this.apiUrl);
    }

    create(industria: Partial<Industria>): Observable<ApiResponse<Industria>> {
        return this.http.post<ApiResponse<Industria>>(this.apiUrl, industria);
    }

    update(id: number, industria: Partial<Industria>): Observable<ApiResponse<Industria>> {
        return this.http.put<ApiResponse<Industria>>(`${this.apiUrl}/${id}`, industria);
    }

    delete(id: number): Observable<ApiResponse<any>> {
        return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
    }
}
