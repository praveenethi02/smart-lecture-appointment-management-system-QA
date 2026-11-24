import {
  timeToMinutes,
  doTimesOverlap,
  isValidTimeRange,
  isSlotInPast,
  isPastCancellationDeadline,
  isValidCalendarDate,
} from '../utils/dateUtils.js';

// Returns [YYYY-MM-DD, HH:mm] in Asia/Colombo for (now + offsetMinutes)
const colombo = (offsetMinutes) => {
  const d = new Date(Date.now() + offsetMinutes * 60000 + 5.5 * 3600000);
  const iso = d.toISOString();
  return [iso.slice(0, 10), iso.slice(11, 16)];
};

describe('timeToMinutes', () => {
  test('09:30 -> 570', () => expect(timeToMinutes('09:30')).toBe(570));
  test('00:00 -> 0', () => expect(timeToMinutes('00:00')).toBe(0));
  test('23:59 -> 1439', () => expect(timeToMinutes('23:59')).toBe(1439));
});

describe('isValidTimeRange - BVA on slot duration (min 5, max 480 minutes)', () => {
  test.each([
    ['09:00', '09:04', false], // 4 min  (below min)
    ['09:00', '09:05', true],  // 5 min  (min boundary)
    ['09:00', '09:06', true],  // 6 min  (just above min)
    ['09:00', '16:59', true],  // 479 min (just below max)
    ['09:00', '17:00', true],  // 480 min (max boundary)
    ['09:00', '17:01', false], // 481 min (above max)
    ['10:00', '10:00', false], // zero duration
    ['10:00', '09:00', false], // end before start
  ])('%s to %s -> %s', (start, end, expected) => {
    expect(isValidTimeRange(start, end)).toBe(expected);
  });
});

describe('doTimesOverlap - EP', () => {
  test('partial overlap', () => expect(doTimesOverlap('09:00', '10:00', '09:30', '10:30')).toBe(true));
  test('one slot inside another', () => expect(doTimesOverlap('09:00', '12:00', '10:00', '11:00')).toBe(true));
  test('touching slots do not overlap', () => expect(doTimesOverlap('09:00', '10:00', '10:00', '11:00')).toBe(false));
  test('separate slots', () => expect(doTimesOverlap('09:00', '10:00', '13:00', '14:00')).toBe(false));
});

describe('isSlotInPast - BVA around "now"', () => {
  test('1 minute ago is past', () => expect(isSlotInPast(...colombo(-1))).toBe(true));
  test('1 minute ahead is not past', () => expect(isSlotInPast(...colombo(1))).toBe(false));
  test('yesterday is past', () => expect(isSlotInPast(...colombo(-24 * 60))).toBe(true));
});

describe('isValidCalendarDate - BVA on month and day (BUG-01, BUG-02)', () => {
  test.each([
    ['2027-01-01', true],  // month min boundary
    ['2027-12-31', true],  // month max boundary, last day of year
    ['2027-00-10', false], // month below min
    ['2027-13-01', false], // month above max (BUG-01)
    ['2027-02-28', true],  // last day of Feb (non-leap year)
    ['2027-02-29', false], // Feb 29 in a non-leap year
    ['2028-02-29', true],  // Feb 29 in a leap year
    ['2027-02-31', false], // rolls over to March (BUG-02)
    ['2027-04-31', false], // April has 30 days
    ['2027-05-00', false], // day below min
    ['2027-5-1', false],   // wrong format
  ])('%s -> %s', (date, expected) => {
    expect(isValidCalendarDate(date)).toBe(expected);
  });
});

describe('isPastCancellationDeadline - BVA (deadline = 2 hours)', () => {
  test('119 min before start -> cannot cancel', () =>
    expect(isPastCancellationDeadline(...colombo(119), 2)).toBe(true));
  test('121 min before start -> can cancel', () =>
    expect(isPastCancellationDeadline(...colombo(121), 2)).toBe(false));
});