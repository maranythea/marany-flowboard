import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface GoogleProfile {
  firstName: string;
  lastName: string;
  email: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = 'https://marany-flowboard-ccpv.vercel.app';

  private readonly authenticated = signal(false);
  private readonly currentUser = signal<User | null>(null);

  readonly isAuthenticated = this.authenticated.asReadonly();
  readonly user = this.currentUser.asReadonly();

  constructor(private readonly http: HttpClient) {
    this.restoreSession();
  }

  private restoreSession(): void {
    const token = this.getToken();
    const storedUser = localStorage.getItem('user');

    if (token) {
      this.authenticated.set(true);
      if (storedUser) {
        try {
          this.currentUser.set(JSON.parse(storedUser));
        } catch {
          // If parsing failed, ignore
        }
      }
    }
  }

  getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  private handleAuthSuccess(response: LoginResponse): void {
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('user', JSON.stringify(response.user));
    this.authenticated.set(true);
    this.currentUser.set(response.user);
  }

  // =========================================================
  // EMAIL / PASSWORD LOGIN
  // =========================================================

  login(email: string, password: string): Observable<LoginResponse> {
    const normalizedEmail = email.trim().toLowerCase();
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/login`, {
        email: normalizedEmail,
        password,
      })
      .pipe(
        tap((response) => this.handleAuthSuccess(response)),
      );
  }

  // =========================================================
  // EMAIL / PASSWORD REGISTER
  // =========================================================

  register(
    name: string,
    email: string,
    password: string,
    googleCredential?: string,
  ): Observable<LoginResponse> {
    const normalizedEmail = email.trim().toLowerCase();
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/register`, {
        name: name.trim(),
        email: normalizedEmail,
        password,
        googleCredential,
      })
      .pipe(
        tap((response) => this.handleAuthSuccess(response)),
      );
  }

  // =========================================================
  // GET VERIFIED GOOGLE PROFILE
  // =========================================================

  getGoogleProfile(credential: string): Observable<GoogleProfile> {
    return this.http.post<GoogleProfile>(`${this.apiUrl}/google/profile`, {
      credential,
    });
  }

  // =========================================================
  // GOOGLE REGISTER
  // =========================================================

  googleRegister(credential: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/google/register`, {
        credential,
      })
      .pipe(
        tap((response) => this.handleAuthSuccess(response)),
      );
  }

  // =========================================================
  // GOOGLE LOGIN
  // =========================================================

  googleLogin(credential: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/google/login`, {
        credential,
      })
      .pipe(
        tap((response) => this.handleAuthSuccess(response)),
      );
  }

  // =========================================================
  // LOGOUT
  // =========================================================

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    this.authenticated.set(false);
    this.currentUser.set(null);
  }
}

