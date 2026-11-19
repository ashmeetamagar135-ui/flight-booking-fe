import { Component, OnInit, inject, signal } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { Airline } from '../../models/models';
import { AdminService, FlightBody } from '../../services/admin.service';
import { errorMessage } from '../../services/api-error';
import { FlightService } from '../../services/flight.service';

/** The arrival must be later than the departure (same rule as the API). */
function arrivalAfterDeparture(group: AbstractControl): ValidationErrors | null {
  const dep = group.get('departure_time')?.value;
  const arr = group.get('arrival_time')?.value;
  return dep && arr && arr <= dep ? { order: true } : null;
}

@Component({
  selector: 'app-flight-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './flight-form.html',
  styleUrl: './flight-form.css',
})
export class FlightForm implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private admin = inject(AdminService);
  private flightService = inject(FlightService);

  /** Set when editing an existing flight; null when adding a new one. */
  flightId = this.route.snapshot.paramMap.get('id');

  airlines = signal<Airline[]>([]);
  loading = signal(false);
  saving = signal(false);
  error = signal('');

  form = this.fb.group(
    {
      airline_id: ['', Validators.required],
      flight_number: ['', [Validators.required, Validators.maxLength(10)]],
      departure_city: ['', Validators.required],
      arrival_city: ['', Validators.required],
      departure_time: ['', Validators.required],
      arrival_time: ['', Validators.required],
      ticket_price: [0, [Validators.required, Validators.min(1)]],
      status: 'scheduled',
      seat_count: [30, [Validators.required, Validators.min(1), Validators.max(500)]],
    },
    { validators: arrivalAfterDeparture },
  );

  ngOnInit(): void {
    this.admin.getAirlines().subscribe({
      next: (list) => this.airlines.set(list),
      error: (err) => this.error.set(errorMessage(err)),
    });

    if (this.flightId) {
      // Editing: load the flight and fill the form.
      this.loading.set(true);
      this.flightService.getFlight(this.flightId).subscribe({
        next: (f) => {
          this.form.patchValue({
            airline_id: f.airline_id,
            flight_number: f.flight_number,
            departure_city: f.departure_city,
            arrival_city: f.arrival_city,
            departure_time: f.departure_time.slice(0, 16), // "YYYY-MM-DDTHH:mm"
            arrival_time: f.arrival_time.slice(0, 16),
            ticket_price: f.ticket_price,
            status: f.status,
          });
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(errorMessage(err));
          this.loading.set(false);
        },
      });
    }
  }

  /** POST /flights (new) or PUT /flights/<id> (edit). */
  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const body: FlightBody = {
      airline_id: v.airline_id,
      flight_number: v.flight_number.trim(),
      departure_city: v.departure_city.trim(),
      arrival_city: v.arrival_city.trim(),
      departure_time: v.departure_time + ':00Z', // the API stores times in UTC
      arrival_time: v.arrival_time + ':00Z',
      ticket_price: Number(v.ticket_price),
    };

    this.saving.set(true);
    this.error.set('');
    let request: Observable<unknown>;
    if (this.flightId) {
      body.status = v.status;
      request = this.admin.updateFlight(this.flightId, body);
    } else {
      body.seat_count = Number(v.seat_count);
      request = this.admin.createFlight(body);
    }
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/admin/flights']);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(errorMessage(err));
      },
    });
  }
}
