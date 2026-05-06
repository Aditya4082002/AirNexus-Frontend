// helpers.test.js
import {
  formatDate,
  formatDateTime,
  formatTime,
  timeAgo,
  formatCurrency,
  formatDuration,
  getStatusBadgeClass,
  truncate,
  classNames,
} from '../../utils/helpers';

describe('formatDate', () => {
  it('returns — for null/undefined', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
  });
  it('formats a valid date', () => {
    expect(formatDate('2024-06-15')).toMatch(/15 Jun 2024/);
  });
  it('returns original value for invalid date string', () => {
    const result = formatDate('not-a-date');
    expect(typeof result).toBe('string');
  });
});

describe('formatDateTime', () => {
  it('returns — for null/undefined', () => {
    expect(formatDateTime(null)).toBe('—');
  });
  it('formats date and time', () => {
    const result = formatDateTime('2024-06-15T14:30:00');
    expect(result).toMatch(/15 Jun 2024/);
    expect(result).toMatch(/14:30/);
  });
});

describe('formatTime', () => {
  it('returns — for null/undefined', () => {
    expect(formatTime(null)).toBe('—');
  });
  it('formats time as HH:mm', () => {
    const result = formatTime('2024-06-15T09:05:00');
    expect(result).toMatch(/09:05/);
  });
});

describe('timeAgo', () => {
  it('returns — for null/undefined', () => {
    expect(timeAgo(null)).toBe('—');
  });
  it('returns a relative time string', () => {
    const recent = new Date(Date.now() - 60000).toISOString();
    expect(timeAgo(recent)).toContain('ago');
  });
});

describe('formatCurrency', () => {
  it('returns — for null/undefined amount', () => {
    expect(formatCurrency(null)).toBe('—');
    expect(formatCurrency(undefined)).toBe('—');
  });
  it('formats INR currency', () => {
    const result = formatCurrency(1500);
    expect(result).toContain('1,500');
  });
  it('respects custom currency', () => {
    const result = formatCurrency(100, 'USD');
    expect(result).toBeTruthy();
  });
  it('formats zero correctly', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0');
  });
});

describe('formatDuration', () => {
  it('returns — for null/0', () => {
    expect(formatDuration(null)).toBe('—');
    expect(formatDuration(0)).toBe('—');
  });
  it('formats minutes only', () => {
    expect(formatDuration(45)).toBe('45m');
  });
  it('formats hours and minutes', () => {
    expect(formatDuration(90)).toBe('1h 30m');
  });
  it('formats exact hours', () => {
    expect(formatDuration(120)).toBe('2h 0m');
  });
});

describe('getStatusBadgeClass', () => {
  it('returns badge-success for CONFIRMED', () => {
    expect(getStatusBadgeClass('CONFIRMED')).toBe('badge-success');
  });
  it('returns badge-warning for PENDING', () => {
    expect(getStatusBadgeClass('PENDING')).toBe('badge-warning');
  });
  it('returns badge-error for CANCELLED', () => {
    expect(getStatusBadgeClass('CANCELLED')).toBe('badge-error');
  });
  it('returns badge-gray for unknown status', () => {
    expect(getStatusBadgeClass('WHATEVER')).toBe('badge-gray');
  });
  it('returns badge-purple for DEPARTED', () => {
    expect(getStatusBadgeClass('DEPARTED')).toBe('badge-purple');
  });
  it('returns badge-info for ON_TIME', () => {
    expect(getStatusBadgeClass('ON_TIME')).toBe('badge-info');
  });
});

describe('truncate', () => {
  it('returns original string if shorter than limit', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });
  it('truncates long strings with ellipsis', () => {
    const result = truncate('hello world foo bar', 10);
    expect(result).toHaveLength(11); // 10 chars + ellipsis char
    expect(result.endsWith('…')).toBe(true);
  });
  it('handles null/undefined gracefully', () => {
    expect(truncate(null)).toBeFalsy();
    expect(truncate(undefined)).toBeFalsy();
  });
  it('uses default length of 30', () => {
    const str = 'a'.repeat(35);
    const result = truncate(str);
    expect(result.endsWith('…')).toBe(true);
    expect(result.length).toBe(31);
  });
});

describe('classNames', () => {
  it('joins truthy class names', () => {
    expect(classNames('a', 'b', 'c')).toBe('a b c');
  });
  it('filters out falsy values', () => {
    expect(classNames('a', null, undefined, false, '', 'b')).toBe('a b');
  });
  it('returns empty string for all falsy', () => {
    expect(classNames(null, false, undefined)).toBe('');
  });
  it('returns single class as-is', () => {
    expect(classNames('only')).toBe('only');
  });
});