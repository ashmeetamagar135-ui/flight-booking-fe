import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../config';
import { Airport, Page } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AirportService {
  private http = inject(HttpClient);

  /** GET /airports with optional country / city filters and pagination. */
  list(country: string, city: string, page: number, pageSize: number): Observable<Page<Airport>> {
    let params = new HttpParams().set('page', page).set('page_size', pageSize);
    if (country) {
      params = params.set('country', country);
    }
    if (city) {
      params = params.set('city', city);
    }
    return this.http.get<Page<Airport>>(`${API_URL}/airports`, { params });
  }

  /** GET /airports/near - uses MongoDB's geospatial $geoNear on the server. */
  near(lat: number, lng: number, maxKm: number): Observable<{ count: number; results: Airport[] }> {
    const params = new HttpParams().set('lat', lat).set('lng', lng).set('max_km', maxKm);
    return this.http.get<{ count: number; results: Airport[] }>(`${API_URL}/airports/near`, { params });
  }
}
