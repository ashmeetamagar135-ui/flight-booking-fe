import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_URL } from '../config';
import { ReviewList } from '../models/models';
import { utc } from './flight.service';

/** Reviews live inside each flight: /flights/<id>/reviews */
@Injectable({ providedIn: 'root' })
export class ReviewService {
  private http = inject(HttpClient);

  private url(flightId: string): string {
    return `${API_URL}/flights/${flightId}/reviews`;
  }

  /** GET - optional minimum star rating as a query-string filter. */
  list(flightId: string, minRating: string): Observable<ReviewList> {
    let params = new HttpParams();
    if (minRating) {
      params = params.set('min_rating', minRating);
    }
    return this.http.get<ReviewList>(this.url(flightId), { params }).pipe(
      map((res) => ({
        ...res,
        reviews: res.reviews.map((r) => ({ ...r, created_at: utc(r.created_at) })),
      })),
    );
  }

  /** POST */
  add(flightId: string, rating: number, comment: string) {
    return this.http.post<{ message: string; review_id: string }>(this.url(flightId), {
      rating,
      comment,
    });
  }

  /** PUT */
  update(flightId: string, reviewId: string, rating: number, comment: string) {
    return this.http.put<{ message: string }>(`${this.url(flightId)}/${reviewId}`, {
      rating,
      comment,
    });
  }

  /** DELETE */
  remove(flightId: string, reviewId: string) {
    return this.http.delete<void>(`${this.url(flightId)}/${reviewId}`);
  }
}
