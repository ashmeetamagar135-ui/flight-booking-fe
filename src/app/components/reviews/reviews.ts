import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Review } from '../../models/models';
import { errorMessage } from '../../services/api-error';
import { AuthService } from '../../services/auth.service';
import { ReviewService } from '../../services/review.service';

@Component({
  selector: 'app-reviews',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './reviews.html',
  styleUrl: './reviews.css',
})
export class Reviews implements OnInit {
  /** The flight whose reviews are shown (given by the parent page). */
  flightId = input.required<string>();

  private reviewService = inject(ReviewService);
  private fb = inject(NonNullableFormBuilder);
  auth = inject(AuthService);

  reviews = signal<Review[]>([]);
  average = signal<number | null>(null);
  minRating = signal('');
  loading = signal(false);
  busy = signal(false);
  error = signal('');
  notice = signal('');

  editingId = signal<string | null>(null);
  deleteId = signal<string | null>(null);

  form = this.fb.group({
    rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
    comment: ['', [Validators.required, Validators.maxLength(500)]],
  });

  /** One review per user per flight: hide the add form once you have one.
   *  (Also hidden while a rating filter is on, because your review may be filtered out.) */
  canAdd = computed(
    () =>
      this.auth.isLoggedIn() &&
      this.minRating() === '' &&
      !this.reviews().some((r) => r.user_id === this.auth.userId()),
  );

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.reviewService.list(this.flightId(), this.minRating()).subscribe({
      next: (res) => {
        this.reviews.set(res.reviews);
        this.average.set(res.average_rating);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  setMinRating(value: string): void {
    this.minRating.set(value);
    this.editingId.set(null);
    this.load();
  }

  canManage(r: Review): boolean {
    return r.user_id === this.auth.userId() || this.auth.isAdmin();
  }

  stars(n: number): string {
    return '★'.repeat(n) + '☆'.repeat(5 - n);
  }

  startEdit(r: Review): void {
    this.deleteId.set(null);
    this.notice.set('');
    this.form.setValue({ rating: r.rating, comment: r.comment });
    this.editingId.set(r.review_id);
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset({ rating: 5, comment: '' });
  }

  /** POST a new review, or PUT when a review is being edited. */
  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { rating, comment } = this.form.getRawValue();
    const editing = this.editingId();
    this.busy.set(true);
    this.error.set('');

    const request = editing
      ? this.reviewService.update(this.flightId(), editing, rating, comment)
      : this.reviewService.add(this.flightId(), rating, comment);

    request.subscribe({
      next: () => {
        this.busy.set(false);
        this.notice.set(editing ? 'Review updated.' : 'Thank you for your review!');
        this.cancelEdit();
        this.load();
      },
      error: (err) => {
        this.busy.set(false);
        this.error.set(errorMessage(err));
      },
    });
  }

  /** DELETE (after an "are you sure" click) */
  confirmDelete(r: Review): void {
    this.busy.set(true);
    this.error.set('');
    this.reviewService.remove(this.flightId(), r.review_id).subscribe({
      next: () => {
        this.busy.set(false);
        this.deleteId.set(null);
        this.notice.set('Review deleted.');
        this.load();
      },
      error: (err) => {
        this.busy.set(false);
        this.error.set(errorMessage(err));
      },
    });
  }
}
