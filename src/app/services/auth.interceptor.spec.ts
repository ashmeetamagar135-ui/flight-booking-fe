import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { API_URL } from '../config';
import { AuthService } from './auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let auth: AuthService;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('fb_token', 'my.test.token');
    localStorage.setItem('fb_role', 'passenger');
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([{ path: '**', children: [] }]),
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => controller.verify());

  it('adds the Bearer token to API requests', () => {
    http.get(`${API_URL}/reservations`).subscribe();
    const req = controller.expectOne(`${API_URL}/reservations`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer my.test.token');
    req.flush({});
  });

  it('does not send the token to other websites', () => {
    http.get('https://example.com/data').subscribe();
    const req = controller.expectOne('https://example.com/data');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('logs the user out when the API answers 401', () => {
    http.get(`${API_URL}/reservations`).subscribe({ error: () => undefined });
    controller
      .expectOne(`${API_URL}/reservations`)
      .flush({ error: 'Token has expired' }, { status: 401, statusText: 'Unauthorized' });
    expect(auth.isLoggedIn()).toBe(false);
  });

  it('keeps the user logged in after other errors such as 403', () => {
    http.get(`${API_URL}/analytics/bookings`).subscribe({ error: () => undefined });
    controller
      .expectOne(`${API_URL}/analytics/bookings`)
      .flush({ error: 'forbidden' }, { status: 403, statusText: 'Forbidden' });
    expect(auth.isLoggedIn()).toBe(true);
  });
});
