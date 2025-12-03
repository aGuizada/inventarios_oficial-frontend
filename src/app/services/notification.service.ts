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

    getAll(): Observable<ApiResponse<Notification[]>> {
        return this.http.get<ApiResponse<Notification[]>>(this.apiUrl);
    }

    getNoLeidas(): Observable<ApiResponse<Notification[]>> {
        return this.http.get<ApiResponse<Notification[]>>(`${this.apiUrl}/no-leidas`);
    }

    marcarComoLeida(id: number): Observable<ApiResponse<any>> {
        return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${id}/leer`, {});
    }

    marcarTodasComoLeidas(): Observable<ApiResponse<any>> {
        return this.http.put<ApiResponse<any>>(`${this.apiUrl}/leer-todas`, {});
    }

    delete(id: number): Observable<ApiResponse<any>> {
        return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
    }
}
