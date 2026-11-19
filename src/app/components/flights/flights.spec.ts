import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { API_URL } from '../../config';
import { Flights } from './flights';

function flight(id: string, from: string, to: string, seats = 10) {
  return {
    _id: id,
    airline_id: 'a1',
    flight_number: 'BA' + id,
    departure_city: from,
    arrival_city: to,
    departure_time: '2099-01-01T10:00:00',
    arrival_time: '2099-01-01T12:00:00',
    ticket_price: 120,
    status: 'scheduled',
    available_seats: seats,
  };
}

describe('Flights page', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Flights],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  /** Creates the page and answers its two start-up requests. */
  function start(total: number, results: object[]) {
    const fixture = TestBed.createComponent(Flights);
    fixture.detectChanges();
    http
      .expectOne((r) => r.url === `${API_URL}/flights`)
      .flush({ page: 1, page_size: 9, total, results });
    http
      .expectOne((r) => r.url === `${API_URL}/airports`)
      .flush({ page: 1, page_size: 50, total: 2, results: [{ city: 'London' }, { city: 'Paris' }] });
    fixture.detectChanges();
    return fixture;
  }

  it('shows one card for each flight returned', async () => {
    const fixture = start(2, [flight('1', 'London', 'Paris'), flight('2', 'Rome', 'Madrid')]);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('article.flight').length).toBe(2);
    expect(el.textContent).toContain('2');
    expect(el.textContent).toContain('flights found');
  });

  it('shows a friendly message when nothing matches', async () => {
    const fixture = start(0, []);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No flights match your search');
  });

  it('calculates the number of pages from the total', () => {
    const fixture = start(25, [flight('1', 'London', 'Paris')]);
    expect(fixture.componentInstance.totalPages()).toBe(3); // 25 flights, 9 per page
  });

  it('shows "Sold out" when no seats are left', async () => {
    const fixture = start(1, [flight('1', 'London', 'Paris', 0)]);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Sold out');
  });

  it('search() goes back to page 1 and sends the filters', () => {
    const fixture = start(25, [flight('1', 'London', 'Paris')]);
    fixture.componentInstance.goTo(2);
    http
      .expectOne((r) => r.url === `${API_URL}/flights`)
      .flush({ page: 2, page_size: 9, total: 25, results: [] });

    fixture.componentInstance.form.patchValue({ from: 'London', sort: 'price', order: 'desc' });
    fixture.componentInstance.search();

    const req = http.expectOne((r) => r.url === `${API_URL}/flights`);
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('from')).toBe('London');
    expect(req.request.params.get('sort')).toBe('price');
    expect(req.request.params.get('order')).toBe('desc');
    req.flush({ page: 1, page_size: 9, total: 1, results: [] });
  });

  it('shows the server error when the API cannot be reached', async () => {
    const fixture = TestBed.createComponent(Flights);
    fixture.detectChanges();
    http
      .expectOne((r) => r.url === `${API_URL}/flights`)
      .error(new ProgressEvent('error'), { status: 0 });
    http.expectOne((r) => r.url === `${API_URL}/airports`).flush({ results: [] });
    fixture.detectChanges();
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Cannot reach the server');
  });
});
