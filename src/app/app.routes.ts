import { Routes } from '@angular/router';
import { FlightDetail } from './components/flight-detail/flight-detail';
import { Flights } from './components/flights/flights';
import { Login } from './components/login/login';
import { MyBookings } from './components/my-bookings/my-bookings';
import { Register } from './components/register/register';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'flights', pathMatch: 'full' },
  { path: 'flights', component: Flights, title: 'Find flights' },
  { path: 'flights/:id', component: FlightDetail, title: 'Flight details' },
  { path: 'bookings', component: MyBookings, canActivate: [authGuard], title: 'My bookings' },
  { path: 'login', component: Login, title: 'Log in' },
  { path: 'register', component: Register, title: 'Create account' },
  { path: '**', redirectTo: 'flights' },
];
