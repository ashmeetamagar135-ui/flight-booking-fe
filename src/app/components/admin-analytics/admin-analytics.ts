import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { BookingTrends, OccupancyReport, RevenueReport } from '../../models/models';
import { AdminService } from '../../services/admin.service';
import { errorMessage } from '../../services/api-error';

@Component({
  selector: 'app-admin-analytics',
  imports: [ReactiveFormsModule, CurrencyPipe],
  templateUrl: './admin-analytics.html',
  styleUrl: './admin-analytics.css',
})
export class AdminAnalytics implements OnInit {
  private admin = inject(AdminService);
  private fb = inject(NonNullableFormBuilder);

  // Optional date range, sent as ?start= and ?end= to the reports.
  range = this.fb.group({ start: '', end: '', order: 'desc' as 'asc' | 'desc' });

  trends = signal<BookingTrends | null>(null);
  revenue = signal<RevenueReport | null>(null);
  occupancy = signal<OccupancyReport | null>(null);
  loading = signal(false);
  error = signal('');

  ngOnInit(): void {
    this.load();
  }

  /** Three GET calls at once; the page updates when all have arrived. */
  load(): void {
    const { start, end, order } = this.range.getRawValue();
    this.loading.set(true);
    this.error.set('');
    forkJoin({
      trends: this.admin.bookingTrends(start, end),
      revenue: this.admin.revenue(start, end),
      occupancy: this.admin.occupancy(8, order),
    }).subscribe({
      next: (r) => {
        this.trends.set(r.trends);
        this.revenue.set(r.revenue);
        this.occupancy.set(r.occupancy);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }
}
