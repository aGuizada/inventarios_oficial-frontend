import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Notification, ApiResponse } from '../interfaces';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private apiUrl = `${environment.apiUrl}/notificaciones`;

    constructor(private http: HttpClient) { }

    getAll(page: number = 1): Observable<ApiResponse<Notification[]>> {
        return this.http.get<ApiResponse<Notification[]>>(`${this.apiUrl}?page=${page}`);
    }

    getNoLeidas(): Observable<ApiResponse<Notification[]>> {
        return this.http.get<ApiResponse<Notification[]>>(`${this.apiUrl}/no-leidas`);
    }

    marcarComoLeida(id: string): Observable<ApiResponse<any>> {
        return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${id}/leer`, {});
    }

    marcarTodasComoLeidas(): Observable<ApiResponse<any>> {
        return this.http.put<ApiResponse<any>>(`${this.apiUrl}/leer-todas`, {});
    }

    delete(id: string): Observable<ApiResponse<any>> {
        return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
    }
}
