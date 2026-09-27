import { describe, expect, it } from 'vitest';
import {
  buildEnamadBadgeUrls,
  normalizeAdminAccess,
  resolveStaffAdminAccess,
  toPublicSiteSettings,
} from './site-settings';
import { createDefaultSiteSettings } from '../constants/default-site-settings';

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

/** Site template with only stats viewing enabled (easy to assert against). */
const template = normalizeAdminAccess(createDefaultSiteSettings().adminAccess);

describe('resolveStaffAdminAccess (ADM-1 unified access issuance)', () => {
  it('lets a per-user override win over the role matrix and site template', () => {
    const override = { ...template, payments: { view: true, manage: true, edit: true } };
    const role = { ...template, payments: { view: true, manage: false, edit: false } };
    const resolved = resolveStaffAdminAccess(override, role, template);
    expect(resolved.payments.manage).toBe(true);
    expect(resolved.payments.edit).toBe(true);
  });

  it('falls back to the custom role matrix when there is no user override', () => {
    const role = { ...template, tickets: { view: true, manage: true, edit: true } };
    const resolved = resolveStaffAdminAccess(null, role, template);
    expect(resolved.tickets.edit).toBe(true);
    // Non-overridden keys still come from the role matrix (derived from template here).
    expect(resolved.tickets.manage).toBe(true);
  });

  it('falls back to the site template when neither override nor role matrix exists', () => {
    const resolved = resolveStaffAdminAccess(null, null, template);
    expect(resolved).toEqual(template);
  });

  it('normalizes legacy boolean flags inside the role matrix', () => {
    const legacyRole = { users: true };
    const resolved = resolveStaffAdminAccess(null, legacyRole, template);
    expect(resolved.users).toEqual({ view: true, manage: true, edit: true });
  });

  it('ignores non-object overrides and role matrices', () => {
    const resolved = resolveStaffAdminAccess('garbage', 42, template);
    expect(resolved).toEqual(template);
  });
});
