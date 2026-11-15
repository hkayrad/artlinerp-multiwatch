import {
  AdminSession,
  FanartItem,
  FanartMetadataUpdate,
  FanartUploadPayload,
  FanartUploadResult,
  FanartVillage,
} from '../types/fanart';

export const FANART_MAX_BYTES = 8 * 1024 * 1024;
export const FANART_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export function validateFanartFile(file: Pick<File, 'type' | 'size'>): string | null {
  if (!FANART_ALLOWED_MIME_TYPES.includes(file.type as (typeof FANART_ALLOWED_MIME_TYPES)[number])) {
    return 'Yalnızca JPG, PNG, WEBP veya GIF görselleri yüklenebilir.';
  }
  if (file.size <= 0) {
    return 'Seçilen dosya boş görünüyor.';
  }
  if (file.size > FANART_MAX_BYTES) {
    return 'Görsel boyutu en fazla 8 MB olabilir.';
  }
  return null;
}

export function filterFanartItems(
  items: FanartItem[],
  village: FanartVillage | 'all',
  query: string
): FanartItem[] {
  const q = query.trim().toLowerCase();
  return items.filter(item => {
    if (village !== 'all' && item.village !== village) {
      return false;
    }
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      item.artist.toLowerCase().includes(q) ||
      (item.description ?? '').toLowerCase().includes(q)
    );
  });
}

async function parseApiResponse<T>(response: Response): Promise<T> {
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    // non-JSON response (e.g., 500 HTML page or PHP unavailable)
  }

  if (!response.ok) {
    const serverMessage =
      payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
        ? payload.error
        : `Sunucu hatası (${response.status})`;
    throw new Error(serverMessage);
  }

  if (payload === null) {
    throw new Error('Sunucudan geçersiz yanıt alındı (PHP API çalışıyor mu?).');
  }

  return payload as T;
}

export async function getAdminSession(): Promise<AdminSession> {
  const response = await fetch('/api/auth.php', {
    method: 'GET',
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
  });
  return parseApiResponse<AdminSession>(response);
}

export async function loginAdmin(username: string, password: string): Promise<AdminSession> {
  const response = await fetch('/api/auth.php', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });
  return parseApiResponse<AdminSession>(response);
}

export async function logoutAdmin(): Promise<AdminSession> {
  const response = await fetch('/api/auth.php', {
    method: 'DELETE',
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
  });
  return parseApiResponse<AdminSession>(response);
}

export async function fetchGallery(village: FanartVillage | 'all' = 'all'): Promise<FanartItem[]> {
  const query = village === 'all' ? '' : `?village=${encodeURIComponent(village)}`;
  const response = await fetch(`/api/fanart.php${query}`, {
    method: 'GET',
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
  });
  const data = await parseApiResponse<{ items: FanartItem[] }>(response);
  return Array.isArray(data.items) ? data.items : [];
}

export async function fetchPendingSubmissions(): Promise<FanartItem[]> {
  const response = await fetch('/api/fanart.php?scope=pending', {
    method: 'GET',
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
  });
  const data = await parseApiResponse<{ items: FanartItem[] }>(response);
  return Array.isArray(data.items) ? data.items : [];
}

export async function uploadFanart(payload: FanartUploadPayload): Promise<FanartUploadResult> {
  const fileError = validateFanartFile(payload.file);
  if (fileError) {
    throw new Error(fileError);
  }

  const formData = new FormData();
  formData.append('image', payload.file);
  formData.append('title', payload.title.trim());
  formData.append('artist', payload.artist.trim());
  formData.append('village', payload.village);
  if (payload.description?.trim()) {
    formData.append('description', payload.description.trim());
  }
  if (payload.website !== undefined) {
    formData.append('website', payload.website);
  }

  const response = await fetch('/api/fanart.php', {
    method: 'POST',
    credentials: 'same-origin',
    body: formData,
  });
  return parseApiResponse<FanartUploadResult>(response);
}

export async function approveSubmission(
  id: string,
  updates: FanartMetadataUpdate = {}
): Promise<FanartItem> {
  const response = await fetch('/api/fanart.php', {
    method: 'PATCH',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ id, action: 'approve', ...updates }),
  });
  const data = await parseApiResponse<{ item: FanartItem }>(response);
  return data.item;
}

export async function updateFanart(
  id: string,
  updates: FanartMetadataUpdate
): Promise<FanartItem> {
  const response = await fetch('/api/fanart.php', {
    method: 'PATCH',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ id, action: 'update', ...updates }),
  });
  const data = await parseApiResponse<{ item: FanartItem }>(response);
  return data.item;
}

export async function deleteFanart(
  id: string,
  scope: 'approved' | 'pending' = 'approved'
): Promise<void> {
  const response = await fetch(
    `/api/fanart.php?id=${encodeURIComponent(id)}&scope=${encodeURIComponent(scope)}`,
    {
      method: 'DELETE',
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    }
  );
  await parseApiResponse<{ deleted: string }>(response);
}
