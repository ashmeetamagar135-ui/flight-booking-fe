import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, of, tap } from 'rxjs';
import { API_URL } from '../config';
import { LoginResponse } from '../models/models';

const TOKEN_KEY = 'fb_token';
const ROLE_KEY = 'fb_role';

/** Reads/writes localStorage safely (it can be blocked in private windows). */
function store(key: string, value?: string | null): string | null {
  try {
    if (value === undefined) {
      return localStorage.getItem(key);
    }
    if (value === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, value);
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** Reads the payload of a JWT (the middle part) without verifying it.
 *  The server does the real verification; this is only to know the expiry. */
function readPayload(token: string): { sub?: string; exp?: number } | null {
  try {
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(part));
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // Signals so every component that reads them updates automatically.
  private _token = signal<string | null>(store(TOKEN_KEY));
  private _role = signal<string | null>(store(ROLE_KEY));

  readonly token = this._token.asReadonly();
  readonly role = this._role.asReadonly();
  readonly isLoggedIn = computed(() => this._token() !== null);
  readonly isAdmin = computed(() => this._role() === 'admin');

  constructor() {
    // If the saved token has already expired, forget it straight away.
    const saved = this._token();
    if (saved) {
      const exp = readPayload(saved)?.exp;
      if (exp && exp * 1000 < Date.now()) {
        this.clear();
      }
    }
  }

  /** The logged-in user's id, taken from the token ('sub' claim). */
  userId(): string | null {
    const t = this._token();
    return t ? (readPayload(t)?.sub ?? null) : null;
  }

  register(name: string, email: string, password: string) {
    return this.http.post<{ message: string; user_id: string }>(
      `${API_URL}/auth/register`,
      { name, email, password },
    );
  }

  login(email: string, password: string) {
    return this.http
      .post<LoginResponse>(`${API_URL}/auth/login`, { email, password })
      .pipe(
        tap((res) => {
          store(TOKEN_KEY, res.token);
          store(ROLE_KEY, res.role);
          this._token.set(res.token);
          this._role.set(res.role);
        }),
      );
  }

  /** Tells the API to blacklist the token, then forgets it locally. */
  logout() {
    return this.http.post(`${API_URL}/auth/logout`, {}).pipe(
      catchError(() => of(null)),
      finalize(() => {
        this.clear();
        this.router.navigate(['/login']);
      }),
    );
  }

  /** Forget the token locally (no API call). */
  clear(): void {
    store(TOKEN_KEY, null);
    store(ROLE_KEY, null);
    this._token.set(null);
    this._role.set(null);
  }
}
