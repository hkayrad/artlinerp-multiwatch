export type FanartVillage = 'konoha' | 'suna' | 'genel';

export interface FanartItem {
  id: string;
  filename: string;
  url: string;
  title: string;
  artist: string;
  village: FanartVillage;
  description?: string;
  width?: number | null;
  height?: number | null;
  createdAt: string;
  approvedAt?: string;
  uploadedBy: 'admin' | 'visitor';
}

export interface AdminSession {
  authenticated: boolean;
  username?: string | null;
  configured: boolean;
}

export interface FanartUploadPayload {
  file: File;
  title: string;
  artist: string;
  village: FanartVillage;
  description?: string;
  website?: string; // honeypot
}

export interface FanartUploadResult {
  status: 'approved' | 'pending';
  item: FanartItem;
}

export interface FanartMetadataUpdate {
  title?: string;
  artist?: string;
  village?: FanartVillage;
  description?: string;
}
