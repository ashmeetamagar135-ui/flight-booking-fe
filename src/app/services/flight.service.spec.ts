import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_URL } from '../config';
import { FlightService, utc } from './flight.service';

describe('FlightService', () => {
  let service: FlightService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(FlightService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('utc() adds a Z only when the time has no time zone', () => {
    expect(utc('2026-12-01T10:00:00')).toBe('2026-12-01T10:00:00Z');
    expect(utc('2026-12-01T10:00:00Z')).toBe('2026-12-01T10:00:00Z');
    expect(utc('2026-12-01T10:00:00+01:00')).toBe('2026-12-01T10:00:00+01:00');
  });

  it('sends only the filters that were filled in, plus paging', () => {
    service
      .getFlights({ from: 'London', to: '', max_price: '200', available_only: false, sort: 'price', order: 'asc' }, 2, 9)
      .subscribe();

    const req = http.expectOne((r) => r.url === `${API_URL}/flights`);
    expect(req.request.method).toBe('GET');
    const p = req.request.params;
    expect(p.get('from')).toBe('London');
    expect(p.get('max_price')).toBe('200');
    expect(p.get('sort')).toBe('price');
    expect(p.get('page')).toBe('2');
    expect(p.get('page_size')).toBe('9');
    expect(p.has('to')).toBe(false);
    expect(p.has('available_only')).toBe(false);
    req.flush({ page: 2, page_size: 9, total: 0, results: [] });
  });

  it('sends available_only=true when it is ticked', () => {
    service.getFlights({ available_only: true }, 1, 9).subscribe();
    const req = http.expectOne((r) => r.url === `${API_URL}/flights`);
    expect(req.request.params.get('available_only')).toBe('true');
    req.flush({ page: 1, page_size: 9, total: 0, results: [] });
  });

  it('marks the times in the results as UTC', () => {
    let departure = '';
    service.getFlights({}, 1, 9).subscribe((page) => (departure = page.results[0].departure_time));
    http.expectOne((r) => r.url === `${API_URL}/flights`).flush({
      page: 1,
      page_size: 9,
      total: 1,
      results: [
        {
          _id: '1',
          flight_number: 'BA100',
          departure_time: '2026-12-01T10:00:00',
          arrival_time: '2026-12-01T12:00:00',
        },
      ],
    });
    expect(departure).toBe('2026-12-01T10:00:00Z');
  });

  it('getFlight() asks for one flight by id', () => {
    service.getFlight('abc123').subscribe();
    const req = http.expectOne(`${API_URL}/flights/abc123`);
    expect(req.request.method).toBe('GET');
    req.flush({ _id: 'abc123', departure_time: '2026-12-01T10:00:00', arrival_time: '2026-12-01T12:00:00' });
  });
});
