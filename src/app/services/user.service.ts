import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, ApiResponse, PaginatedResponse, PaginationParams } from '../interfaces';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private apiUrl = `${environment.apiUrl}/users`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<ApiResponse<User[]>> {
        return this.http.get<ApiResponse<User[]>>(this.apiUrl);
    }

    getPaginated(params?: PaginationParams): Observable<ApiResponse<PaginatedResponse<User>>> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach(key => {
                const value = (params as any)[key];
                if (value !== undefined && value !== null) {
                    httpParams = httpParams.set(key, value.toString());
                }
            });
        }
        return this.http.get<ApiResponse<PaginatedResponse<User>>>(this.apiUrl, { params: httpParams });
    }

    getById(id: number): Observable<ApiResponse<User>> {
        return this.http.get<ApiResponse<User>>(`${this.apiUrl}/${id}`);
    }

    create(user: Partial<User>): Observable<ApiResponse<User>> {
        return this.http.post<ApiResponse<User>>(this.apiUrl, user);
    }

    update(id: number, user: Partial<User>): Observable<ApiResponse<User>> {
        return this.http.put<ApiResponse<User>>(`${this.apiUrl}/${id}`, user);
    }

    delete(id: number): Observable<ApiResponse<any>> {
        return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
    }
}
