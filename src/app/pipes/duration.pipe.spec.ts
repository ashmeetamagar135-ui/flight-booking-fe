import { DurationPipe } from './duration.pipe';

describe('DurationPipe', () => {
  const pipe = new DurationPipe();

  it('shows hours and minutes', () => {
    expect(pipe.transform('2026-12-01T10:00:00Z', '2026-12-01T12:17:00Z')).toBe('2h 17m');
  });

  it('shows whole hours with 0 minutes', () => {
    expect(pipe.transform('2026-12-01T10:00:00Z', '2026-12-01T13:00:00Z')).toBe('3h 0m');
  });

  it('shows only minutes for short flights', () => {
    expect(pipe.transform('2026-12-01T10:00:00Z', '2026-12-01T10:45:00Z')).toBe('45m');
  });

  it('returns nothing when the arrival is not after the departure', () => {
    expect(pipe.transform('2026-12-01T10:00:00Z', '2026-12-01T09:00:00Z')).toBe('');
  });

  it('returns nothing for text that is not a date', () => {
    expect(pipe.transform('not a date', 'also not')).toBe('');
  });
});
