import { describe, expect, it } from 'vitest';
import {
  invitationExpiryDays,
  uploadLimitMegabytes,
  validateOfficeSettings,
} from '@/features/office/office-settings-schema';

describe('office settings schema', () => {
  it('accepts the inclusive invitation expiry and upload limit bounds', () => {
    expect(validateOfficeSettings({
      invitationExpiryDays: invitationExpiryDays.min,
      uploadLimitMegabytes: uploadLimitMegabytes.max,
    })).toEqual({});
  });

  it.each([
    ['invitation expiry', { invitationExpiryDays: invitationExpiryDays.min - 1 }],
    ['upload limit', { uploadLimitMegabytes: uploadLimitMegabytes.max + 1 }],
  ])('rejects an out-of-bounds %s', (_field, values) => {
    expect(validateOfficeSettings({
      invitationExpiryDays: 7,
      uploadLimitMegabytes: 25,
      ...values,
    })).toMatchObject({
      [Object.keys(values)[0]]: expect.any(String),
    });
  });
});
