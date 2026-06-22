import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

export type LoginHintResponse = {
  isAdminEmail: boolean;
  hasCard: boolean;
};

type LoginHintApiResponse = {
  isAdminEmail?: boolean;
  adminEmail?: boolean;
  hasCard: boolean;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private readonly http: HttpClient) {}

  loginHint(email: string): Observable<LoginHintResponse> {
    const params = new HttpParams().set('email', email);
    return this.http
      .get<LoginHintApiResponse>('/api/auth/login-hint', { params })
      .pipe(
        map((res) => ({
          isAdminEmail: res.isAdminEmail ?? res.adminEmail ?? false,
          hasCard: res.hasCard
        }))
      );
  }

  adminLogin(payload: { email: string; password: string }): Observable<void> {
    return this.http.post<void>('/api/auth/admin/login', payload);
  }

  adminMe(): Observable<unknown> {
    return this.http.get('/api/auth/admin/me');
  }

  adminLogout(): Observable<void> {
    return this.http.post<void>('/api/auth/admin/logout', {});
  }
}

