import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Airport } from '../../models/models';
import { AirportService } from '../../services/airport.service';
import { errorMessage } from '../../services/api-error';

@Component({
  selector: 'app-airports',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './airports.html',
  styleUrl: './airports.css',
})
export class Airports implements OnInit {
  private airportService = inject(AirportService);
  private fb = inject(NonNullableFormBuilder);

  // ---- all airports (filter + pagination)
  filter = this.fb.group({ country: '', city: '' });
  airports = signal<Airport[]>([]);
  total = signal(0);
  page = signal(1);
  pageSize = 8;
  loading = signal(false);
  error = signal('');
  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize)));

  // ---- airports near a point
  near = this.fb.group({
    lat: [51.47, [Validators.required, Validators.min(-90), Validators.max(90)]],
    lng: [-0.45, [Validators.required, Validators.min(-180), Validators.max(180)]],
    max_km: [500, [Validators.required, Validators.min(1), Validators.max(5000)]],
  });
  nearby = signal<Airport[] | null>(null);
  nearError = signal('');
  locating = signal(false);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    const { country, city } = this.filter.getRawValue();
    this.airportService.list(country.trim(), city.trim(), this.page(), this.pageSize).subscribe({
      next: (res) => {
        this.airports.set(res.results);
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  search(): void {
    this.page.set(1);
    this.load();
  }

  goTo(page: number): void {
    if (page < 1 || page > this.totalPages()) {
      return;
    }
    this.page.set(page);
    this.load();
  }

  /** Ask the browser for the user's position, then search around it. */
  useMyLocation(): void {
    if (!('geolocation' in navigator)) {
      this.nearError.set('Your browser cannot share its location. Type the coordinates instead.');
      return;
    }
    this.locating.set(true);
    this.nearError.set('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.locating.set(false);
        this.near.patchValue({
          lat: Math.round(pos.coords.latitude * 10000) / 10000,
          lng: Math.round(pos.coords.longitude * 10000) / 10000,
        });
        this.findNear();
      },
      () => {
        this.locating.set(false);
        this.nearError.set('Could not get your location. Type the coordinates instead.');
      },
    );
  }

  findNear(): void {
    if (this.near.invalid) {
      this.near.markAllAsTouched();
      return;
    }
    const { lat, lng, max_km } = this.near.getRawValue();
    this.nearError.set('');
    this.airportService.near(Number(lat), Number(lng), Number(max_km)).subscribe({
      next: (res) => this.nearby.set(res.results),
      error: (err) => {
        this.nearby.set(null);
        this.nearError.set(errorMessage(err));
      },
    });
  }
}
