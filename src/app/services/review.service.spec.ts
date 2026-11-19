import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_URL } from '../config';
import { ReviewService } from './review.service';

describe('ReviewService', () => {
  let service: ReviewService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReviewService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('list() sends min_rating only when a filter is chosen', () => {
    service.list('f1', '4').subscribe();
    const req = http.expectOne((r) => r.url === `${API_URL}/flights/f1/reviews`);
    expect(req.request.params.get('min_rating')).toBe('4');
    req.flush({ count: 0, average_rating: null, reviews: [] });

    service.list('f1', '').subscribe();
    const req2 = http.expectOne((r) => r.url === `${API_URL}/flights/f1/reviews`);
    expect(req2.request.params.has('min_rating')).toBe(false);
    req2.flush({ count: 0, average_rating: null, reviews: [] });
  });

  it('add() POSTs the rating and comment', () => {
    service.add('f1', 5, 'Great flight').subscribe();
    const req = http.expectOne(`${API_URL}/flights/f1/reviews`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ rating: 5, comment: 'Great flight' });
    req.flush({ message: 'review added', review_id: 'rv1' });
  });

  it('update() PUTs to the review address', () => {
    service.update('f1', 'rv1', 3, 'Okay').subscribe();
    const req = http.expectOne(`${API_URL}/flights/f1/reviews/rv1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ rating: 3, comment: 'Okay' });
    req.flush({ message: 'review updated' });
  });

  it('remove() sends DELETE', () => {
    service.remove('f1', 'rv1').subscribe();
    const req = http.expectOne(`${API_URL}/flights/f1/reviews/rv1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });
});
