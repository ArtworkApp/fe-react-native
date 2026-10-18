import { hasActiveFilters, parseYearRange } from './filters';

test('accepts optional inclusive years from 0000 through 9999', () => {
  expect(parseYearRange('', '')).toEqual({ filters: {} });
  expect(parseYearRange('0000', '9999')).toEqual({
    filters: { yearStart: 0, yearEnd: 9999 },
  });
  expect(parseYearRange('1900', '1900')).toEqual({
    filters: { yearStart: 1900, yearEnd: 1900 },
  });
});

test.each([
  ['-1', '', 'Enter years from 0000 to 9999.'],
  ['10000', '', 'Enter years from 0000 to 9999.'],
  ['19.5', '', 'Enter years from 0000 to 9999.'],
  ['1950', '1900', 'From year must not exceed To year.'],
])('rejects invalid range %s to %s', (from, to, error) => {
  expect(parseYearRange(from, to)).toEqual({ error });
});

test('recognizes active year filters', () => {
  expect(hasActiveFilters({})).toBe(false);
  expect(hasActiveFilters({ yearStart: 0 })).toBe(true);
  expect(hasActiveFilters({ yearEnd: 2020 })).toBe(true);
  expect(hasActiveFilters({ artistId: '42' })).toBe(true);
});
