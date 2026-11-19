import { Routes } from '@angular/router';
import { AdminAnalytics } from './components/admin-analytics/admin-analytics';
import { AdminFlights } from './components/admin-flights/admin-flights';
import { FlightDetail } from './components/flight-detail/flight-detail';
import { FlightForm } from './components/flight-form/flight-form';
import { Flights } from './components/flights/flights';
import { Login } from './components/login/login';
import { MyBookings } from './components/my-bookings/my-bookings';
import { Register } from './components/register/register';
import { adminGuard } from './guards/admin.guard';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'flights', pathMatch: 'full' },
  { path: 'flights', component: Flights, title: 'Find flights' },
  { path: 'flights/:id', component: FlightDetail, title: 'Flight details' },
  { path: 'bookings', component: MyBookings, canActivate: [authGuard], title: 'My bookings' },
  { path: 'login', component: Login, title: 'Log in' },
  { path: 'register', component: Register, title: 'Create account' },

  // ---- admin only ----
  { path: 'admin/flights', component: AdminFlights, canActivate: [adminGuard], title: 'Manage flights' },
  { path: 'admin/flights/new', component: FlightForm, canActivate: [adminGuard], title: 'Add flight' },
  { path: 'admin/flights/:id/edit', component: FlightForm, canActivate: [adminGuard], title: 'Edit flight' },
  { path: 'admin/analytics', component: AdminAnalytics, canActivate: [adminGuard], title: 'Analytics' },

  { path: '**', redirectTo: 'flights' },
];
