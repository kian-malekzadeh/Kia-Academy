import { describe, expect, it } from 'vitest';
import { createDefaultSiteSettings } from '../constants/default-site-settings';
import { buildEnamadBadgeUrls, toPublicSiteSettings } from './site-settings';

describe('toPublicSiteSettings', () => {
  it('redacts payment/SMS secrets and admin access from public payloads', () => {
    const full = createDefaultSiteSettings();
    full.payment.apiKey = 'secret-api-key';
    full.payment.merchantId = 'merchant-123';
    full.sms.apiKey = 'kavenegar-secret';
    full.sms.enabled = true;
    full.enamad = { enabled: true, codeId: '12345', code: 'AbCdEf' };
    full.adminAccess.settings.view = true;

    const pub = toPublicSiteSettings(full);

    expect(pub.payment.apiKey).toBe('');
    expect(pub.payment.merchantId).toBe('');
    expect(pub.payment.provider).toBe(full.payment.provider);
    expect(pub.payment.enabled).toBe(full.payment.enabled);
    expect(pub.sms.apiKey).toBe('');
    expect(pub.sms.enabled).toBe(true);
    expect(pub.sms.provider).toBe(full.sms.provider);
    expect(pub.enamad).toEqual(full.enamad);
    expect(pub.adminAccess.settings.view).toBe(false);
    expect(pub.general.siteName).toBe(full.general.siteName);
  });
});

describe('buildEnamadBadgeUrls', () => {
  it('builds trustseal URLs when enabled with safe id/code', () => {
    const urls = buildEnamadBadgeUrls({
      enabled: true,
      codeId: '12345',
      code: 'AbCdEf12',
    });
    expect(urls?.href).toContain('trustseal.enamad.ir');
    expect(urls?.href).toContain('id=12345');
    expect(urls?.imgSrc).toContain('logo.aspx');
  });

  it('rejects disabled or unsafe values', () => {
    expect(buildEnamadBadgeUrls({ enabled: false, codeId: '1', code: '2' })).toBeNull();
    expect(buildEnamadBadgeUrls({ enabled: true, codeId: '', code: '2' })).toBeNull();
    expect(
      buildEnamadBadgeUrls({ enabled: true, codeId: '1<script>', code: '2' }),
    ).toBeNull();
  });
});
