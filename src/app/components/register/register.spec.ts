import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { API_URL } from '../../config';
import { Register } from './register';

describe('Register component', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([{ path: '**', children: [] }])],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('is invalid when the two passwords do not match', () => {
    const fixture = TestBed.createComponent(Register);
    fixture.detectChanges();
    fixture.componentInstance.form.setValue({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password1',
      confirm: 'different1',
    });
    expect(fixture.componentInstance.form.hasError('mismatch')).toBe(true);
    expect(fixture.componentInstance.form.invalid).toBe(true);
  });

  it('rejects a password shorter than 8 characters', () => {
    const fixture = TestBed.createComponent(Register);
    fixture.detectChanges();
    const password = fixture.componentInstance.form.controls.password;
    password.setValue('short');
    expect(password.hasError('minlength')).toBe(true);
    password.setValue('longenough');
    expect(password.valid).toBe(true);
  });

  it('does not call the API while the form is invalid', () => {
    const fixture = TestBed.createComponent(Register);
    fixture.detectChanges();
    fixture.componentInstance.submit();
    http.expectNone(`${API_URL}/auth/register`);
  });

  it('registers when everything is valid', () => {
    const fixture = TestBed.createComponent(Register);
    fixture.detectChanges();
    fixture.componentInstance.form.setValue({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password1',
      confirm: 'password1',
    });
    fixture.componentInstance.submit();
    const req = http.expectOne(`${API_URL}/auth/register`);
    expect(req.request.body).toEqual({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password1',
    });
    req.flush({ message: 'account created', user_id: '1' }, { status: 201, statusText: 'Created' });
    // After registering, the app logs the user in automatically.
    http.expectOne(`${API_URL}/auth/login`).flush({ token: 'a.b.c', role: 'passenger' });
  });
});
