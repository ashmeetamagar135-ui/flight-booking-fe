import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_URL } from '../config';
import { AirportService } from './airport.service';

describe('AirportService', () => {
  let service: AirportService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AirportService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('list() sends the filters that were filled in', () => {
    service.list('France', '', 2, 8).subscribe();
    const req = http.expectOne((r) => r.url === `${API_URL}/airports`);
    expect(req.request.params.get('country')).toBe('France');
    expect(req.request.params.has('city')).toBe(false);
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('page_size')).toBe('8');
    req.flush({ page: 2, page_size: 8, total: 0, results: [] });
  });

  it('near() sends lat, lng and max_km to the geo endpoint', () => {
    service.near(51.47, -0.45, 300).subscribe();
    const req = http.expectOne((r) => r.url === `${API_URL}/airports/near`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('lat')).toBe('51.47');
    expect(req.request.params.get('lng')).toBe('-0.45');
    expect(req.request.params.get('max_km')).toBe('300');
    req.flush({ count: 0, results: [] });
  });
});
