import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Flight } from '../../models/models';
import { AdminService } from '../../services/admin.service';
import { errorMessage } from '../../services/api-error';
import { FlightService } from '../../services/flight.service';

@Component({
  selector: 'app-admin-flights',
  imports: [ReactiveFormsModule, RouterLink, DatePipe, CurrencyPipe],
  templateUrl: './admin-flights.html',
  styleUrl: './admin-flights.css',
})
export class AdminFlights implements OnInit {
  private flightService = inject(FlightService);
  private admin = inject(AdminService);
  private fb = inject(NonNullableFormBuilder);

  filter = this.fb.group({ from: '', to: '' });

  flights = signal<Flight[]>([]);
  total = signal(0);
  page = signal(1);
  pageSize = 10;
  loading = signal(false);
  error = signal('');
  notice = signal('');
  deleteId = signal<string | null>(null);

  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize)));

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    const { from, to } = this.filter.getRawValue();
    this.flightService
      .getFlights({ from: from.trim(), to: to.trim(), sort: 'departure', order: 'asc' }, this.page(), this.pageSize)
      .subscribe({
        next: (res) => {
          this.flights.set(res.results);
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

  /** DELETE /flights/<id> */
  confirmDelete(f: Flight): void {
    this.admin.deleteFlight(f._id).subscribe({
      next: () => {
        this.deleteId.set(null);
        this.notice.set(`Flight ${f.flight_number} deleted.`);
        this.load();
      },
      error: (err) => {
        this.deleteId.set(null);
        this.error.set(errorMessage(err));
      },
    });
  }
}
