import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, finalize, switchMap, of, map } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest, User, ApiResponse } from '../interfaces';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = `${environment.apiUrl}/auth`;
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    constructor(private http: HttpClient) {
        this.loadUserFromStorage();
        this.checkAndRefreshUser();
    }

    login(credentials: LoginRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
            switchMap(response => {
                // Save token immediately so subsequent requests work (via interceptor)
                localStorage.setItem('token', response.access_token);

                // If role is missing, fetch full user details
                if (!response.user.rol && response.user.id) {
                    console.log('Role missing in login response, fetching full user details...');
                    return this.http.get<any>(`${environment.apiUrl}/users/${response.user.id}`).pipe(
                        map(userResponse => {
                            // Backend returns the user object directly or wrapped in data depending on the endpoint/resource
                            // Based on UserController::show it returns response()->json($user) which is the user object directly
                            const fullUser = userResponse.data || userResponse;
                            if (fullUser) {
                                response.user = fullUser;
                            }
                            return response;
                        })
                    );
                }
                return of(response);
            }),
            tap(response => {
                this.setSession(response);
            })
        );
    }

    private checkAndRefreshUser(): void {
        const user = this.getCurrentUser();
        if (user && !user.rol) {
            console.log('User loaded from storage but role is missing. Refreshing...');
            this.http.get<any>(`${environment.apiUrl}/users/${user.id}`).subscribe({
                next: (userResponse) => {
                    const fullUser = userResponse.data || userResponse;
                    if (fullUser) {
                        console.log('User refreshed successfully', fullUser);
                        // Update session with full user data
                        const currentToken = this.getToken();
                        if (currentToken) {
                            this.setSession({
                                user: fullUser,
                                access_token: currentToken,
                                token_type: 'Bearer'
                            });
                        }
                    }
                },
                error: (err) => console.error('Failed to refresh user data', err)
            });
        }
    }

    register(data: RegisterRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
            tap(response => {
                this.setSession(response);
            })
        );
    }

    logout(): Observable<any> {
        return this.http.post(`${this.apiUrl}/logout`, {}).pipe(
            finalize(() => {
                this.clearSession();
            })
        );
    }

    private setSession(authResult: AuthResponse): void {
        localStorage.setItem('token', authResult.access_token);
        localStorage.setItem('user', JSON.stringify(authResult.user));
        this.currentUserSubject.next(authResult.user);
    }

    private clearSession(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.currentUserSubject.next(null);
    }

    private loadUserFromStorage(): void {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            this.currentUserSubject.next(JSON.parse(userStr));
        }
    }

    getToken(): string | null {
        return localStorage.getItem('token');
    }

    isLoggedIn(): boolean {
        return !!this.getToken();
    }

    getCurrentUser(): User | null {
        return this.currentUserSubject.value;
    }

    hasRole(roleName: string): boolean {
        const user = this.getCurrentUser();
        console.log('Checking role:', roleName, 'User:', user, 'User Role:', user?.rol?.nombre);
        return user?.rol?.nombre?.toLowerCase() === roleName.toLowerCase();
    }

    isVendedor(): boolean {
        return this.hasRole('vendedor');
    }
}
