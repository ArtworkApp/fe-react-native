import { COUNTRY_NAMES, searchCountries } from './countries';

test('contains the full country and territory list independent of artwork data', () => {
  expect(COUNTRY_NAMES.length).toBeGreaterThan(240);
  expect(COUNTRY_NAMES).toContain('France');
  expect(COUNTRY_NAMES).toContain('United Kingdom');
  expect(COUNTRY_NAMES).toContain('Zimbabwe');
});

test('searches country names by case-insensitive substring', () => {
  expect(searchCountries('fra')).toContain('France');
  expect(searchCountries('UNITED')).toContain('United Kingdom');
  expect(searchCountries('zzz')).toEqual([]);
});
