import { HttpErrorResponse } from '@angular/common/http';

/** Turn any HTTP error into a short message a person can read. */
export function errorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      return 'Cannot reach the server. Is the Flask API running?';
    }
    const body = err.error as { error?: string } | null;
    if (body && typeof body.error === 'string') {
      return body.error;
    }
    return `Request failed (${err.status}).`;
  }
  return 'Something went wrong.';
}
