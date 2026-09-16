export type OfficeSettings = {
  invitationExpiryDays: number;
  uploadLimitMegabytes: number;
};

type NumericRange = {
  min: number;
  max: number;
  unit: string;
};

export const invitationExpiryDays: NumericRange = { min: 1, max: 30, unit: 'days' };
export const uploadLimitMegabytes: NumericRange = { min: 1, max: 100, unit: 'MB' };

export type OfficeSettingsErrors = Partial<Record<keyof OfficeSettings, string>>;

function validateRange(value: number, range: NumericRange, label: string): string | undefined {
  if (!Number.isInteger(value) || value < range.min || value > range.max) {
    return `${label} must be a whole number between ${range.min} and ${range.max} ${range.unit}.`;
  }
}

export function validateOfficeSettings(settings: OfficeSettings): OfficeSettingsErrors {
  return {
    invitationExpiryDays: validateRange(settings.invitationExpiryDays, invitationExpiryDays, 'Invitation expiry'),
    uploadLimitMegabytes: validateRange(settings.uploadLimitMegabytes, uploadLimitMegabytes, 'Upload limit'),
  };
}

export const defaultOfficeSettings: OfficeSettings = {
  invitationExpiryDays: 7,
  uploadLimitMegabytes: 25,
};
