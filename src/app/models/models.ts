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

export interface Airline {
  _id: string;
  airline_code: string;
  airline_name: string;
}

export interface ReviewList {
  count: number;
  average_rating: number | null;
  reviews: Review[];
}

// ---- admin analytics (GET /analytics/...) ----
export interface BookingTrends {
  bookings_per_month: {
    month: string;
    total: number;
    confirmed: number;
    cancelled: number;
    cancellation_rate_percent: number;
  }[];
  top_routes: { from: string; to: string; bookings: number }[];
}

export interface RevenueReport {
  total_paid: number;
  by_airline: { airline: string; payments: number; revenue: number; average_payment: number }[];
  by_payment_status: { payment_status: string; count: number; total: number }[];
}

export interface OccupancyReport {
  flights: {
    flight_number: string;
    departure_city: string;
    arrival_city: string;
    total_seats: number;
    booked_seats: number;
    occupancy_percent: number;
  }[];
  airlines: { airline: string; flights: number; average_occupancy_percent: number }[];
}
