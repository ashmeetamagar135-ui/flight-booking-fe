import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { API_URL } from '../../config';
import { Login } from './login';

describe('Login component', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([{ path: '**', children: [] }])],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('shows validation messages instead of calling the API when empty', async () => {
    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
    fixture.componentInstance.submit();
    fixture.detectChanges();
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Enter a valid email address.');
    expect(text).toContain('Password is required.');
    http.expectNone(`${API_URL}/auth/login`);
  });

  it('sends the email and password to the API when valid', () => {
    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
    fixture.componentInstance.form.setValue({ email: 'alice@test.com', password: 'Passenger123' });
    fixture.componentInstance.submit();

    const req = http.expectOne(`${API_URL}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'alice@test.com', password: 'Passenger123' });
    req.flush({ token: 'a.b.c', role: 'passenger' });
  });

  it('shows the API error message when the login is refused', async () => {
    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
    fixture.componentInstance.form.setValue({ email: 'alice@test.com', password: 'wrong' });
    fixture.componentInstance.submit();
    http
      .expectOne(`${API_URL}/auth/login`)
      .flush({ error: 'invalid email or password' }, { status: 401, statusText: 'Unauthorized' });
    fixture.detectChanges();
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('invalid email or password');
  });
});
