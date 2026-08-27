import rawProvinces from '../data/iran-provinces-cities.json';

export interface IranCity {
  id: number;
  name: string;
}

export interface IranProvince {
  id: number;
  name: string;
  cities: IranCity[];
}

/** District/zone suffixes like «تبریز1-» that are not real city names. */
const DISTRICT_NAME_PATTERN = /\d+-\s*$/;

function sanitizeCities(cities: IranCity[]): IranCity[] {
  const seen = new Set<string>();
  const result: IranCity[] = [];
  for (const city of cities) {
    const name = String(city.name || '').trim();
    if (!name || DISTRICT_NAME_PATTERN.test(name)) continue;
    if (seen.has(name)) continue;
    seen.add(name);
    result.push({ id: city.id, name });
  }
  return result;
}

const PROVINCES: IranProvince[] = (rawProvinces as IranProvince[]).map((province) => ({
  id: province.id,
  name: province.name,
  cities: sanitizeCities(province.cities ?? []),
}));

const provinceByName = new Map(PROVINCES.map((p) => [p.name, p]));

export function getIranProvinces(): IranProvince[] {
  return PROVINCES;
}

export function getIranProvinceNames(): string[] {
  return PROVINCES.map((p) => p.name);
}

export function getCitiesForProvince(provinceName: string): IranCity[] {
  const province = provinceByName.get(String(provinceName || '').trim());
  return province ? province.cities : [];
}

export function isValidIranProvince(provinceName: string): boolean {
  return provinceByName.has(String(provinceName || '').trim());
}

export function isValidIranCity(provinceName: string, cityName: string): boolean {
  const cities = getCitiesForProvince(provinceName);
  const city = String(cityName || '').trim();
  return cities.some((item) => item.name === city);
}

export function getIranGeoStats(): { provinceCount: number; cityCount: number } {
  return {
    provinceCount: PROVINCES.length,
    cityCount: PROVINCES.reduce((sum, p) => sum + p.cities.length, 0),
  };
}
