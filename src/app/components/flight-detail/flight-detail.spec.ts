import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { API_URL } from '../../config';
import { FlightDetail } from './flight-detail';

function flightWithSeats(departure = '2099-01-01T10:00:00', status = 'scheduled', free = 2) {
  return {
    _id: 'f1',
    airline_id: 'a1',
    flight_number: 'BA100',
    departure_city: 'London',
    arrival_city: 'Paris',
    departure_time: departure,
    arrival_time: '2099-01-01T12:00:00',
    ticket_price: 99,
    status,
    available_seats: free,
    seats: [
      { seat_id: 1, seat_number: '1A', class: 'business', status: 'available' },
      { seat_id: 2, seat_number: '1B', class: 'business', status: 'booked' },
      { seat_id: 3, seat_number: '1C', class: 'business', status: 'available' },
    ],
  };
}

describe('FlightDetail page', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [FlightDetail],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: 'f1' }) } } },
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function open(flight: object) {
    const fixture = TestBed.createComponent(FlightDetail);
    fixture.detectChanges();
    http.expectOne(`${API_URL}/flights/f1`).flush(flight);
    fixture.detectChanges();
    // The reviews box (a child component) loads its own data.
    http
      .expectOne((r) => r.url === `${API_URL}/flights/f1/reviews`)
      .flush({ count: 0, average_rating: null, reviews: [] });
    fixture.detectChanges();
    return fixture;
  }

  it('draws the seat map and disables seats that are taken', async () => {
    const fixture = open(flightWithSeats());
    await fixture.whenStable();
    const seats = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button.seat');
    expect(seats.length).toBe(3);
    expect(seats[0].disabled).toBe(false); // 1A free
    expect(seats[1].disabled).toBe(true); // 1B booked
  });

  it('asks a logged-out visitor to log in before booking', async () => {
    const fixture = open(flightWithSeats());
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Please log in to book');
  });

  it('lets a logged-in user pick a seat and shows the Book button', async () => {
    localStorage.setItem('fb_token', 'a.b.c');
    localStorage.setItem('fb_role', 'passenger');
    const fixture = open(flightWithSeats());
    fixture.componentInstance.selectSeat('1A');
    fixture.detectChanges();
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Book seat 1A');
  });

  it('POSTs the reservation and moves on to payment', () => {
    localStorage.setItem('fb_token', 'a.b.c');
    localStorage.setItem('fb_role', 'passenger');
    const fixture = open(flightWithSeats());
    fixture.componentInstance.selectSeat('1A');
    fixture.componentInstance.book();

    const req = http.expectOne(`${API_URL}/reservations`);
    expect(req.request.body).toEqual({ flight_id: 'f1', seat_number: '1A' });
    req.flush({ message: 'ok', reservation_id: 'r1', amount: 99 });
    expect(fixture.componentInstance.step()).toBe('pay');

    // The page reloads the flight to show the seat as booked.
    http.expectOne(`${API_URL}/flights/f1`).flush(flightWithSeats());
  });

  it('refreshes the seat map when the seat was already taken (409)', () => {
    localStorage.setItem('fb_token', 'a.b.c');
    localStorage.setItem('fb_role', 'passenger');
    const fixture = open(flightWithSeats());
    fixture.componentInstance.selectSeat('1A');
    fixture.componentInstance.book();

    http
      .expectOne(`${API_URL}/reservations`)
      .flush({ error: 'that seat is already booked' }, { status: 409, statusText: 'Conflict' });
    expect(fixture.componentInstance.bookError()).toBe('that seat is already booked');
    expect(fixture.componentInstance.selected()).toBeNull();
    http.expectOne(`${API_URL}/flights/f1`).flush(flightWithSeats());
  });

  it('explains why a cancelled flight cannot be booked', () => {
    const fixture = open(flightWithSeats('2099-01-01T10:00:00', 'cancelled'));
    expect(fixture.componentInstance.blockReason()).toBe('This flight has been cancelled.');
  });

  it('explains why a flight that already left cannot be booked', () => {
    const fixture = open(flightWithSeats('2001-01-01T10:00:00'));
    expect(fixture.componentInstance.blockReason()).toBe('This flight has already departed.');
  });

  it('explains when a flight is sold out', () => {
    const fixture = open(flightWithSeats('2099-01-01T10:00:00', 'scheduled', 0));
    expect(fixture.componentInstance.blockReason()).toBe('This flight is sold out.');
  });
});
