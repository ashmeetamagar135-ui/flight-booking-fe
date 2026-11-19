import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_URL } from '../config';
import {
  Airline,
  BookingTrends,
  OccupancyReport,
  RevenueReport,
} from '../models/models';

/** What the admin form sends to POST / PUT /flights. */
export interface FlightBody {
  airline_id: string;
  flight_number: string;
  departure_city: string;
  arrival_city: string;
  departure_time: string;
  arrival_time: string;
  ticket_price: number;
  status?: string;
  seat_count?: number;
}

/** Calls that only an admin may make (flight management and reports). */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);

  getAirlines(): Observable<Airline[]> {
    return this.http
      .get<{ results: Airline[] }>(`${API_URL}/airlines`)
      .pipe(map((res) => res.results));
  }

  createFlight(body: FlightBody) {
    return this.http.post<{ message: string; flight_id: string }>(`${API_URL}/flights`, body);
  }

  updateFlight(id: string, body: FlightBody) {
    return this.http.put<{ message: string }>(`${API_URL}/flights/${id}`, body);
  }

  deleteFlight(id: string) {
    return this.http.delete<void>(`${API_URL}/flights/${id}`);
  }

  private range(start: string, end: string): HttpParams {
    let params = new HttpParams();
    if (start) {
      params = params.set('start', start);
    }
    if (end) {
      params = params.set('end', end);
    }
    return params;
  }

  bookingTrends(start: string, end: string) {
    return this.http.get<BookingTrends>(`${API_URL}/analytics/bookings`, {
      params: this.range(start, end),
    });
  }

  revenue(start: string, end: string) {
    return this.http.get<RevenueReport>(`${API_URL}/analytics/revenue`, {
      params: this.range(start, end),
    });
  }

  occupancy(limit: number, order: 'asc' | 'desc') {
    const params = new HttpParams().set('limit', limit).set('order', order);
    return this.http.get<OccupancyReport>(`${API_URL}/analytics/flights`, { params });
  }
}
