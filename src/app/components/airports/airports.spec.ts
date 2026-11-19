import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { API_URL } from '../../config';
import { Airports } from './airports';

const airport = (id: string, code: string, city: string, km?: number) => ({
  _id: id,
  iata_code: code,
  name: city + ' Airport',
  city,
  country: 'Testland',
  distance_km: km,
});

describe('Airports page', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Airports],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function start() {
    const fixture = TestBed.createComponent(Airports);
    fixture.detectChanges();
    http
      .expectOne((r) => r.url === `${API_URL}/airports`)
      .flush({
        page: 1,
        page_size: 8,
        total: 20,
        results: [airport('1', 'LHR', 'London'), airport('2', 'CDG', 'Paris')],
      });
    fixture.detectChanges();
    return fixture;
  }

  it('lists the airports with a link to flights from each city', async () => {
    const fixture = start();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('LHR');
    expect(el.textContent).toContain('Flights from here');
    expect(fixture.componentInstance.totalPages()).toBe(3); // 20 airports, 8 per page
  });

  it('finds airports near a point and shows the distances', async () => {
    const fixture = start();
    fixture.componentInstance.near.setValue({ lat: 51.5, lng: -0.1, max_km: 400 });
    fixture.componentInstance.findNear();

    const req = http.expectOne((r) => r.url === `${API_URL}/airports/near`);
    expect(req.request.params.get('max_km')).toBe('400');
    req.flush({ count: 1, results: [airport('1', 'LHR', 'London', 24.3)] });
    fixture.detectChanges();
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('24.3 km');
  });

  it('does not call the API for impossible coordinates', () => {
    const fixture = start();
    fixture.componentInstance.near.setValue({ lat: 200, lng: 0, max_km: 400 });
    fixture.componentInstance.findNear();
    http.expectNone((r) => r.url === `${API_URL}/airports/near`);
    expect(fixture.componentInstance.near.invalid).toBe(true);
  });

  it('shows the error text when the API refuses the search', async () => {
    const fixture = start();
    fixture.componentInstance.findNear();
    http
      .expectOne((r) => r.url === `${API_URL}/airports/near`)
      .flush({ error: 'lat and lng are required' }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('lat and lng are required');
  });
});
