// Shapes of the data that the Flask API sends and receives.

export interface Seat {
  seat_id: number;
  seat_number: string;
  class: 'business' | 'economy';
  status: 'available' | 'booked';
}

export interface Review {
  review_id: string;
  user_id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface Flight {
  _id: string;
  airline_id: string;
  flight_number: string;
  departure_city: string;
  arrival_city: string;
  departure_time: string;
  arrival_time: string;
  ticket_price: number;
  status: 'scheduled' | 'delayed' | 'cancelled';
  available_seats: number;
  seats?: Seat[];
  reviews?: Review[];
}

export interface Airport {
  _id: string;
  iata_code: string;
  name: string;
  city: string;
  country: string;
}

/** Every list endpoint in the API answers in this paged shape. */
export interface Page<T> {
  page: number;
  page_size: number;
  total: number;
  results: T[];
}

/** Query-string filters accepted by GET /flights. */
export interface FlightFilters {
  from?: string;
  to?: string;
  date?: string;
  min_price?: string;
  max_price?: string;
  available_only?: boolean;
  sort?: 'price' | 'departure';
  order?: 'asc' | 'desc';
}

export interface LoginResponse {
  token: string;
  role: 'passenger' | 'admin';
}

/** A booking, as returned by GET /reservations (flight and payment are joined in). */
export interface Reservation {
  _id: string;
  user_id: string;
  flight_id: string;
  seat_number: string;
  booking_date: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  amount: number;
  flight?: {
    flight_number: string;
    departure_city: string;
    arrival_city: string;
    departure_time: string;
    arrival_time: string;
    status: string;
  };
  payment?: {
    payment_status: 'paid' | 'pending' | 'refunded';
    method: string;
    payment_date: string;
  };
}

export type PaymentMethod = 'card' | 'paypal' | 'bank_transfer';
