import type { ApiSchema } from '@/shared/types/index';

export type PortalAuditLog = {
  id: string;
  document_id: string;
  user_id?: string | null;
  action: string;
  details?: Record<string, unknown> | null;
  created_at: string;
};

export type PortalDocumentRequest = {
  id: string;
  requester_id: string;
  requester_email: string;
  requester_name: string;
  document_id: string;
  document_name?: string | null;
  description: string;
  status: string;
  lawyer_id?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
};

export type PortalDocumentRequestList = {
  requests: PortalDocumentRequest[];
  total: number;
};

export type PortalSearchHit = ApiSchema<'GlobalSearchHit'> & {
  text?: string;
};

export type PortalUserProfile = ApiSchema<'UserProfileResponse'> & {
  mfa_enabled?: boolean;
};
