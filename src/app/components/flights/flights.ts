import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Flight, FlightFilters } from '../../models/models';
import { FlightService } from '../../services/flight.service';
import { errorMessage } from '../../services/api-error';
import { DurationPipe } from '../../pipes/duration.pipe';

@Component({
  selector: 'app-flights',
  imports: [ReactiveFormsModule, RouterLink, DatePipe, CurrencyPipe, NgClass, DurationPipe],
  templateUrl: './flights.html',
  styleUrl: './flights.css',
})
export class Flights implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private flightService = inject(FlightService);
  private route = inject(ActivatedRoute);

  // The search form. Each control matches a query-string name in the API.
  form = this.fb.group({
    from: '',
    to: '',
    date: '',
    min_price: '',
    max_price: '',
    sort: 'departure' as 'departure' | 'price',
    order: 'asc' as 'asc' | 'desc',
    available_only: false,
  });

  // Screen state is kept in signals so the page refreshes by itself.
  flights = signal<Flight[]>([]);
  total = signal(0);
  page = signal(1);
  pageSize = signal(9);
  loading = signal(false);
  error = signal('');
  cities = signal<string[]>([]);

  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));

  /** Page numbers to show: the current page and up to 2 either side. */
  pageNumbers = computed(() => {
    const current = this.page();
    const last = this.totalPages();
    const start = Math.max(1, current - 2);
    const end = Math.min(last, current + 2);
    const numbers: number[] = [];
    for (let n = start; n <= end; n++) {
      numbers.push(n);
    }
    return numbers;
  });

  ngOnInit(): void {
    // Links such as /flights?from=London (from the Airports page) pre-fill the search.
    const query = this.route.snapshot.queryParamMap;
    this.form.patchValue({ from: query.get('from') ?? '', to: query.get('to') ?? '' });
    this.load();
    // Fill the city suggestion lists from the airports collection.
    this.flightService.getAirports().subscribe({
      next: (res) => {
        const names = new Set(res.results.map((a) => a.city));
        this.cities.set([...names].sort());
      },
      error: () => this.cities.set([]),
    });
  }

  /** Called by the Search button: always start again from page 1. */
  search(): void {
    this.page.set(1);
    this.load();
  }

  reset(): void {
    this.form.reset();
    this.search();
  }

  goTo(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.page()) {
      return;
    }
    this.page.set(page);
    this.load();
  }

  setPageSize(value: string): void {
    this.pageSize.set(Number(value));
    this.search();
  }

  private load(): void {
    this.loading.set(true);
    this.error.set('');
    const f = this.form.getRawValue();
    const filters: FlightFilters = {
      from: f.from.trim(),
      to: f.to.trim(),
      date: f.date,
      min_price: f.min_price,
      max_price: f.max_price,
      sort: f.sort,
      order: f.order,
      available_only: f.available_only,
    };
    this.flightService.getFlights(filters, this.page(), this.pageSize()).subscribe({
      next: (res) => {
        this.flights.set(res.results);
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: (err) => {
        this.flights.set([]);
        this.total.set(0);
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }
}
