import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { adminGuard } from './admin.guard';
import { authGuard } from './auth.guard';

function run(guard: typeof authGuard, url: string) {
  const route = {} as ActivatedRouteSnapshot;
  const state = { url } as RouterStateSnapshot;
  return TestBed.runInInjectionContext(() => guard(route, state));
}

describe('route guards', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideRouter([])] });
  });

  function login(role: string): void {
    localStorage.setItem('fb_token', 'a.b.c');
    localStorage.setItem('fb_role', role);
  }

  it('authGuard sends a logged-out user to /login and remembers the page', () => {
    const result = run(authGuard, '/bookings');
    expect(result instanceof UrlTree).toBe(true);
    const router = TestBed.inject(Router);
    expect(router.serializeUrl(result as UrlTree)).toBe('/login?returnUrl=%2Fbookings');
  });

  it('authGuard lets a logged-in user through', () => {
    login('passenger');
    expect(run(authGuard, '/bookings')).toBe(true);
  });

  it('adminGuard turns a passenger away', () => {
    login('passenger');
    const result = run(adminGuard, '/admin/flights');
    const router = TestBed.inject(Router);
    expect(router.serializeUrl(result as UrlTree)).toBe('/flights');
  });

  it('adminGuard lets an admin through', () => {
    login('admin');
    expect(run(adminGuard, '/admin/flights')).toBe(true);
  });

  it('adminGuard sends a logged-out user to /login', () => {
    const result = run(adminGuard, '/admin/flights');
    const router = TestBed.inject(Router);
    expect(router.serializeUrl(result as UrlTree)).toContain('/login');
  });
});
