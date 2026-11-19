import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { API_URL } from '../config';
import { AuthService } from './auth.service';

/** Builds a fake JWT whose payload has the given fields (the signature is not checked in the browser). */
function fakeToken(payload: object): string {
  return `header.${btoa(JSON.stringify(payload))}.signature`;
}

describe('AuthService', () => {
  let http: HttpTestingController;

  function setup(): AuthService {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([{ path: '**', children: [] }])],
    });
    http = TestBed.inject(HttpTestingController);
    return TestBed.inject(AuthService);
  }

  beforeEach(() => localStorage.clear());
  afterEach(() => http.verify());

  it('starts logged out when nothing is saved', () => {
    const auth = setup();
    expect(auth.isLoggedIn()).toBe(false);
    expect(auth.isAdmin()).toBe(false);
  });

  it('login() posts the credentials and stores the token and role', () => {
    const auth = setup();
    auth.login('admin@flights.com', 'Admin12345').subscribe();

    const req = http.expectOne(`${API_URL}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'admin@flights.com', password: 'Admin12345' });
    req.flush({ token: 'abc.def.ghi', role: 'admin' });

    expect(auth.isLoggedIn()).toBe(true);
    expect(auth.isAdmin()).toBe(true);
    expect(auth.token()).toBe('abc.def.ghi');
    expect(localStorage.getItem('fb_token')).toBe('abc.def.ghi');
  });

  it('a passenger is logged in but is not an admin', () => {
    const auth = setup();
    auth.login('alice@test.com', 'Passenger123').subscribe();
    http.expectOne(`${API_URL}/auth/login`).flush({ token: 'a.b.c', role: 'passenger' });
    expect(auth.isLoggedIn()).toBe(true);
    expect(auth.isAdmin()).toBe(false);
  });

  it('logout() calls the API and clears the saved login', () => {
    localStorage.setItem('fb_token', 'a.b.c');
    localStorage.setItem('fb_role', 'passenger');
    const auth = setup();
    expect(auth.isLoggedIn()).toBe(true);

    auth.logout().subscribe();
    const req = http.expectOne(`${API_URL}/auth/logout`);
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'logged out' });

    expect(auth.isLoggedIn()).toBe(false);
    expect(localStorage.getItem('fb_token')).toBeNull();
  });

  it('forgets a saved token that has already expired', () => {
    const expired = fakeToken({ sub: 'u1', exp: Math.floor(Date.now() / 1000) - 60 });
    localStorage.setItem('fb_token', expired);
    const auth = setup();
    expect(auth.isLoggedIn()).toBe(false);
  });

  it('userId() reads the id from the token', () => {
    const token = fakeToken({ sub: 'user-42', exp: Math.floor(Date.now() / 1000) + 3600 });
    localStorage.setItem('fb_token', token);
    const auth = setup();
    expect(auth.userId()).toBe('user-42');
  });

  it('register() posts name, email and password', () => {
    const auth = setup();
    auth.register('Test User', 'test@example.com', 'password1').subscribe();
    const req = http.expectOne(`${API_URL}/auth/register`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password1',
    });
    req.flush({ message: 'account created', user_id: '1' });
  });
});
