import { describe, expect, it } from 'vitest';
import {
  getCitiesForProvince,
  getIranGeoStats,
  getIranProvinces,
  isValidIranCity,
  isValidIranProvince,
} from './iran-geo';

describe('iran geo dataset', () => {
  it('includes all 31 provinces with cities', () => {
    const stats = getIranGeoStats();
    expect(stats.provinceCount).toBe(31);
    expect(stats.cityCount).toBeGreaterThan(1000);
    expect(getIranProvinces()).toHaveLength(31);
  });

  it('filters cities by province and validates pairs', () => {
    expect(isValidIranProvince('تهران')).toBe(true);
    expect(isValidIranCity('تهران', 'تهران')).toBe(true);
    expect(isValidIranCity('تهران', 'شیراز')).toBe(false);
    expect(isValidIranCity('فارس', 'شیراز')).toBe(true);

    const tehranCities = getCitiesForProvince('تهران').map((c) => c.name);
    expect(tehranCities).toContain('تهران');
    expect(tehranCities).not.toContain('شیراز');
  });

  it('excludes numbered district suffix names', () => {
    const eastAz = getCitiesForProvince('آذربایجان شرقی').map((c) => c.name);
    expect(eastAz.some((name) => /\d+-$/.test(name))).toBe(false);
  });
});
