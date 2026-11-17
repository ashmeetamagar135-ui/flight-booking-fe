import { Routes } from '@angular/router';
import { Flights } from './components/flights/flights';
import { Login } from './components/login/login';
import { Register } from './components/register/register';

export const routes: Routes = [
  { path: '', redirectTo: 'flights', pathMatch: 'full' },
  { path: 'flights', component: Flights, title: 'Find flights' },
  { path: 'login', component: Login, title: 'Log in' },
  { path: 'register', component: Register, title: 'Create account' },
  { path: '**', redirectTo: 'flights' },
];
