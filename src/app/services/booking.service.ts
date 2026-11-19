import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_URL } from '../config';
import { Page, PaymentMethod, Reservation } from '../models/models';
import { utc } from './flight.service';

/** Bookings and payments: the POST and PUT calls of the app. */
@Injectable({ providedIn: 'root' })
export class BookingService {
  private http = inject(HttpClient);

  /** POST /reservations - take a seat on a flight. */
  create(flightId: string, seatNumber: string) {
    return this.http.post<{ message: string; reservation_id: string; amount: number }>(
      `${API_URL}/reservations`,
      { flight_id: flightId, seat_number: seatNumber },
    );
  }

  /** GET /reservations - the logged-in user's bookings (filter + pagination). */
  list(page: number, pageSize: number, status: string): Observable<Page<Reservation>> {
    let params = new HttpParams().set('page', page).set('page_size', pageSize);
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<Page<Reservation>>(`${API_URL}/reservations`, { params }).pipe(
      map((p) => ({
        ...p,
        results: p.results.map((r) => ({
          ...r,
          booking_date: utc(r.booking_date),
          flight: r.flight && {
            ...r.flight,
            departure_time: utc(r.flight.departure_time),
            arrival_time: utc(r.flight.arrival_time),
          },
        })),
      })),
    );
  }

  /** PUT /reservations/<id> - move to a different seat on the same flight. */
  changeSeat(reservationId: string, seatNumber: string) {
    return this.http.put<{ message: string; seat_number: string }>(
      `${API_URL}/reservations/${reservationId}`,
      { seat_number: seatNumber },
    );
  }

  /** PUT /reservations/<id>/cancel - cancel (and refund if it was paid). */
  cancel(reservationId: string) {
    return this.http.put<{ message: string; refunded: boolean }>(
      `${API_URL}/reservations/${reservationId}/cancel`,
      {},
    );
  }

  /** POST /payments - pay for a confirmed reservation. */
  pay(reservationId: string, method: PaymentMethod, cardLast4: string) {
    const body: Record<string, string> = { reservation_id: reservationId, method };
    if (method === 'card') {
      body['card_last4'] = cardLast4;
    }
    return this.http.post<{ message: string; payment_id: string; amount: number }>(
      `${API_URL}/payments`,
      body,
    );
  }
}
