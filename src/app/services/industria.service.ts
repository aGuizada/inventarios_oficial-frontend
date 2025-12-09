import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Industria, ApiResponse, PaginatedResponse, PaginationParams } from '../interfaces';
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

    getPaginated(params?: PaginationParams): Observable<ApiResponse<PaginatedResponse<Industria>>> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach(key => {
                const value = (params as any)[key];
                if (value !== undefined && value !== null) {
                    httpParams = httpParams.set(key, value.toString());
                }
            });
        }
        return this.http.get<ApiResponse<PaginatedResponse<Industria>>>(this.apiUrl, { params: httpParams });
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
