import { Pipe, PipeTransform } from '@angular/core';

/**
 * Custom pipe: shows how long a flight takes.
 *   {{ f.departure_time | duration: f.arrival_time }}   ->   "2h 17m"
 */
@Pipe({ name: 'duration' })
export class DurationPipe implements PipeTransform {
  transform(departure: string, arrival: string): string {
    const ms = Date.parse(arrival) - Date.parse(departure);
    if (!Number.isFinite(ms) || ms <= 0) {
      return '';
    }
    const minutes = Math.round(ms / 60000);
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }
}
