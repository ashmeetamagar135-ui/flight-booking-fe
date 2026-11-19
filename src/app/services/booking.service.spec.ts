import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_URL } from '../config';
import { BookingService } from './booking.service';

describe('BookingService', () => {
  let service: BookingService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BookingService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('create() POSTs the flight id and seat number', () => {
    service.create('f1', '4C').subscribe();
    const req = http.expectOne(`${API_URL}/reservations`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ flight_id: 'f1', seat_number: '4C' });
    req.flush({ message: 'ok', reservation_id: 'r1', amount: 100 });
  });

  it('list() sends the page, page size and status filter', () => {
    service.list(2, 6, 'confirmed').subscribe();
    const req = http.expectOne((r) => r.url === `${API_URL}/reservations`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('page_size')).toBe('6');
    expect(req.request.params.get('status')).toBe('confirmed');
    req.flush({ page: 2, page_size: 6, total: 0, results: [] });
  });

  it('list() leaves out the status when it is empty', () => {
    service.list(1, 6, '').subscribe();
    const req = http.expectOne((r) => r.url === `${API_URL}/reservations`);
    expect(req.request.params.has('status')).toBe(false);
    req.flush({ page: 1, page_size: 6, total: 0, results: [] });
  });

  it('changeSeat() uses PUT with the new seat', () => {
    service.changeSeat('r1', '5D').subscribe();
    const req = http.expectOne(`${API_URL}/reservations/r1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ seat_number: '5D' });
    req.flush({ message: 'seat changed', seat_number: '5D' });
  });

  it('cancel() uses PUT on the cancel address', () => {
    service.cancel('r1').subscribe();
    const req = http.expectOne(`${API_URL}/reservations/r1/cancel`);
    expect(req.request.method).toBe('PUT');
    req.flush({ message: 'cancelled', refunded: true });
  });

  it('pay() by card sends the last 4 digits', () => {
    service.pay('r1', 'card', '4242').subscribe();
    const req = http.expectOne(`${API_URL}/payments`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ reservation_id: 'r1', method: 'card', card_last4: '4242' });
    req.flush({ message: 'ok', payment_id: 'p1', amount: 100 });
  });

  it('pay() by PayPal does not send card digits', () => {
    service.pay('r1', 'paypal', '').subscribe();
    const req = http.expectOne(`${API_URL}/payments`);
    expect(req.request.body).toEqual({ reservation_id: 'r1', method: 'paypal' });
    req.flush({ message: 'ok', payment_id: 'p1', amount: 100 });
  });
});
