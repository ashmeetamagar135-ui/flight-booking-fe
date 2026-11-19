import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_URL } from '../config';
import { Airport, Flight, FlightFilters, Page } from '../models/models';

/** The API sends times like "2026-12-01T10:00:00" (UTC, but with no 'Z').
 *  Adding the 'Z' makes the browser read them as UTC, not local time. */
export function utc(value: string): string {
  return /Z$|[+-]\d\d:\d\d$/.test(value) ? value : value + 'Z';
}

export function withUtcTimes(f: Flight): Flight {
  return { ...f, departure_time: utc(f.departure_time), arrival_time: utc(f.arrival_time) };
}

/** All the calls about flights and airports live here, not in components. */
@Injectable({ providedIn: 'root' })
export class FlightService {
  private http = inject(HttpClient);

  /** GET /flights with search filters, sorting and pagination. */
  getFlights(
    filters: FlightFilters,
    page: number,
    pageSize: number,
  ): Observable<Page<Flight>> {
    let params = new HttpParams().set('page', page).set('page_size', pageSize);
    // Only send filters that the user actually filled in.
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '' && value !== false) {
        params = params.set(key, String(value));
      }
    }
    return this.http.get<Page<Flight>>(`${API_URL}/flights`, { params }).pipe(
      map((page) => ({ ...page, results: page.results.map(withUtcTimes) })),
    );
  }

  /** GET /flights/<id> - one flight including its full seat list. */
  getFlight(id: string): Observable<Flight> {
    return this.http.get<Flight>(`${API_URL}/flights/${id}`).pipe(map(withUtcTimes));
  }

  /** GET /airports (used to fill the city suggestions in the search form). */
  getAirports(): Observable<Page<Airport>> {
    const params = new HttpParams().set('page_size', 50);
    return this.http.get<Page<Airport>>(`${API_URL}/airports`, { params });
  }
}
