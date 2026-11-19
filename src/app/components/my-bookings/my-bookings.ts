import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PaymentMethod, Reservation } from '../../models/models';
import { errorMessage } from '../../services/api-error';
import { BookingService } from '../../services/booking.service';
import { cardNeedsLast4 } from '../../services/form-validators';

@Component({
  selector: 'app-my-bookings',
  imports: [ReactiveFormsModule, RouterLink, DatePipe, CurrencyPipe, NgClass],
  templateUrl: './my-bookings.html',
  styleUrl: './my-bookings.css',
})
export class MyBookings implements OnInit {
  private bookings = inject(BookingService);
  private fb = inject(NonNullableFormBuilder);

  items = signal<Reservation[]>([]);
  total = signal(0);
  page = signal(1);
  pageSize = signal(6);
  status = signal('');
  loading = signal(false);
  error = signal('');
  notice = signal('');
  busy = signal(false);

  // Which booking has an open form / confirmation (only one at a time).
  payingId = signal<string | null>(null);
  changingId = signal<string | null>(null);
  cancelId = signal<string | null>(null);

  payForm = this.fb.group(
    { method: 'card' as PaymentMethod, card_last4: '' },
    { validators: cardNeedsLast4 },
  );
  // Seats look like "4C": 1-3 digits then a letter A-F.
  seatControl = this.fb.control('', [
    Validators.required,
    Validators.pattern(/^[0-9]{1,3}[A-Fa-f]$/),
  ]);

  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.bookings.list(this.page(), this.pageSize(), this.status()).subscribe({
      next: (res) => {
        this.items.set(res.results);
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: (err) => {
        this.items.set([]);
        this.total.set(0);
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  setStatus(value: string): void {
    this.status.set(value);
    this.page.set(1);
    this.closeForms();
    this.load();
  }

  goTo(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.page()) {
      return;
    }
    this.page.set(page);
    this.closeForms();
    this.load();
  }

  isPaid(r: Reservation): boolean {
    return r.payment?.payment_status === 'paid';
  }

  paymentLabel(r: Reservation): string {
    const s = r.payment?.payment_status;
    return s === 'paid' ? 'Paid' : s === 'refunded' ? 'Refunded' : 'Unpaid';
  }

  private closeForms(): void {
    this.payingId.set(null);
    this.changingId.set(null);
    this.cancelId.set(null);
  }

  // ---------- pay (POST /payments)
  startPay(r: Reservation): void {
    this.closeForms();
    this.notice.set('');
    this.payForm.reset({ method: 'card', card_last4: '' });
    this.payingId.set(r._id);
  }

  submitPay(r: Reservation): void {
    if (this.payForm.invalid) {
      this.payForm.markAllAsTouched();
      return;
    }
    const { method, card_last4 } = this.payForm.getRawValue();
    this.busy.set(true);
    this.bookings.pay(r._id, method, card_last4).subscribe({
      next: () => {
        this.busy.set(false);
        this.notice.set(`Payment received for ${r.flight?.flight_number ?? 'your flight'}.`);
        this.closeForms();
        this.load();
      },
      error: (err) => {
        this.busy.set(false);
        this.error.set(errorMessage(err));
      },
    });
  }

  // ---------- change seat (PUT /reservations/<id>)
  startChange(r: Reservation): void {
    this.closeForms();
    this.notice.set('');
    this.seatControl.reset('');
    this.changingId.set(r._id);
  }

  submitChange(r: Reservation, event: Event): void {
    event.preventDefault(); // this form has no FormGroup, so stop the page reloading
    if (this.seatControl.invalid) {
      this.seatControl.markAsTouched();
      return;
    }
    this.busy.set(true);
    this.error.set('');
    this.bookings.changeSeat(r._id, this.seatControl.value.trim().toUpperCase()).subscribe({
      next: (res) => {
        this.busy.set(false);
        this.notice.set(`Seat changed to ${res.seat_number}.`);
        this.closeForms();
        this.load();
      },
      error: (err) => {
        this.busy.set(false);
        this.error.set(errorMessage(err));
      },
    });
  }

  // ---------- cancel (PUT /reservations/<id>/cancel), with an "are you sure" step
  askCancel(r: Reservation): void {
    this.closeForms();
    this.notice.set('');
    this.cancelId.set(r._id);
  }

  confirmCancel(r: Reservation): void {
    this.busy.set(true);
    this.error.set('');
    this.bookings.cancel(r._id).subscribe({
      next: (res) => {
        this.busy.set(false);
        this.notice.set(
          res.refunded ? 'Booking cancelled and your payment was refunded.' : 'Booking cancelled.',
        );
        this.closeForms();
        this.load();
      },
      error: (err) => {
        this.busy.set(false);
        this.error.set(errorMessage(err));
      },
    });
  }
}
