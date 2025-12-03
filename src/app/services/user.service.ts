import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, ApiResponse } from '../interfaces';
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
