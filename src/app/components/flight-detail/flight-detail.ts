import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Flight, PaymentMethod, Seat } from '../../models/models';
import { errorMessage } from '../../services/api-error';
import { AuthService } from '../../services/auth.service';
import { BookingService } from '../../services/booking.service';
import { FlightService } from '../../services/flight.service';
import { Reviews } from '../reviews/reviews';
import { cardNeedsLast4 } from '../../services/form-validators';

@Component({
  selector: 'app-flight-detail',
  imports: [ReactiveFormsModule, RouterLink, DatePipe, CurrencyPipe, NgClass, Reviews],
  templateUrl: './flight-detail.html',
  styleUrl: './flight-detail.css',
})
export class FlightDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private flightService = inject(FlightService);
  private bookings = inject(BookingService);
  private fb = inject(NonNullableFormBuilder);
  auth = inject(AuthService);

  flight = signal<Flight | null>(null);
  loading = signal(true);
  error = signal('');

  // Booking happens in 3 steps: choose a seat -> pay -> done.
  step = signal<'select' | 'pay' | 'done'>('select');
  selected = signal<string | null>(null);
  reservationId = signal<string | null>(null);
  amount = signal(0);
  busy = signal(false);
  bookError = signal('');

  payForm = this.fb.group(
    { method: 'card' as PaymentMethod, card_last4: '' },
    { validators: cardNeedsLast4 },
  );

  /** The seats split into rows of 6 for the seat map. */
  rows = computed<Seat[][]>(() => {
    const seats = this.flight()?.seats ?? [];
    const rows: Seat[][] = [];
    for (let i = 0; i < seats.length; i += 6) {
      rows.push(seats.slice(i, i + 6));
    }
    return rows;
  });

  /** Why this flight cannot be booked (empty text = it can be booked). */
  blockReason = computed(() => {
    const f = this.flight();
    if (!f) {
      return '';
    }
    if (f.status === 'cancelled') {
      return 'This flight has been cancelled.';
    }
    if (Date.parse(f.departure_time) <= Date.now()) {
      return 'This flight has already departed.';
    }
    if (f.available_seats === 0) {
      return 'This flight is sold out.';
    }
    return '';
  });

  ngOnInit(): void {
    this.loadFlight();
  }

  loadFlight(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('No flight selected.');
      this.loading.set(false);
      return;
    }
    this.flightService.getFlight(id).subscribe({
      next: (f) => {
        this.flight.set(f);
        this.loading.set(false);
        this.error.set('');
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  selectSeat(seatNumber: string): void {
    this.selected.set(this.selected() === seatNumber ? null : seatNumber);
    this.bookError.set('');
  }

  /** POST /reservations */
  book(): void {
    const f = this.flight();
    const seat = this.selected();
    if (!f || !seat) {
      return;
    }
    this.busy.set(true);
    this.bookError.set('');
    this.bookings.create(f._id, seat).subscribe({
      next: (res) => {
        this.busy.set(false);
        this.reservationId.set(res.reservation_id);
        this.amount.set(res.amount);
        this.step.set('pay');
        this.loadFlight(); // seat map now shows the seat as booked
      },
      error: (err) => {
        this.busy.set(false);
        this.bookError.set(errorMessage(err));
        this.selected.set(null);
        this.loadFlight(); // someone else may have taken it: refresh the map
      },
    });
  }

  /** POST /payments */
  pay(): void {
    const id = this.reservationId();
    if (!id) {
      return;
    }
    if (this.payForm.invalid) {
      this.payForm.markAllAsTouched();
      return;
    }
    const { method, card_last4 } = this.payForm.getRawValue();
    this.busy.set(true);
    this.bookError.set('');
    this.bookings.pay(id, method, card_last4).subscribe({
      next: () => {
        this.busy.set(false);
        this.step.set('done');
      },
      error: (err) => {
        this.busy.set(false);
        this.bookError.set(errorMessage(err));
      },
    });
  }

  payLater(): void {
    this.router.navigate(['/bookings']);
  }
}
