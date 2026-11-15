import { FanartVillage } from '../types/fanart';

export interface FanartVillageMeta {
  id: FanartVillage;
  label: string;
  badgeClass: string;
  activeButtonClass: string;
}

export const FANART_VILLAGE_META: Record<FanartVillage, FanartVillageMeta> = {
  konoha: {
    id: 'konoha',
    label: 'Konoha',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
    activeButtonClass: 'bg-emerald-500 text-slate-950 font-bold border-emerald-400',
  },
  suna: {
    id: 'suna',
    label: 'Suna',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
    activeButtonClass: 'bg-amber-500 text-slate-950 font-bold border-amber-400',
  },
  genel: {
    id: 'genel',
    label: 'Genel',
    badgeClass: 'bg-orange-500/15 text-orange-300 border-orange-500/40',
    activeButtonClass: 'bg-orange-500 text-white font-bold border-orange-400',
  },
};

export const FANART_VILLAGES: FanartVillage[] = ['konoha', 'suna', 'genel'];

export function formatFanartDate(iso?: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}
