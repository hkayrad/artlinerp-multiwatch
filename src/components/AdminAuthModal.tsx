import React, { useEffect, useState } from 'react';
import { Shield, X, AlertTriangle, LogIn } from 'lucide-react';
import { AdminSession } from '../types/fanart';
import { loginAdmin } from '../services/fanartService';

interface AdminAuthFormProps {
  configured: boolean;
  onSuccess: (session: AdminSession) => void;
  onCancel?: () => void;
}

export const AdminAuthForm: React.FC<AdminAuthFormProps> = ({
  configured,
  onSuccess,
  onCancel,
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Kullanıcı adı ve şifre zorunludur.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const session = await loginAdmin(username.trim(), password);
      onSuccess(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Giriş yapılamadı.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      {!configured && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 leading-relaxed">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            Sunucuda <code className="text-amber-300">api/config.php</code> henüz yapılandırılmamış.{' '}
            <code className="text-amber-300">api/config.example.php</code> dosyasını kopyalayıp yönetici şifrenizi ekleyin.
          </span>
        </div>
      )}

      <div>
        <label htmlFor="admin-username" className="block text-[11px] font-semibold text-slate-300 mb-1">
          Yönetici Kullanıcı Adı
        </label>
        <input
          id="admin-username"
          type="text"
          autoComplete="username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full h-9 px-3 rounded-lg bg-ninja-950 border border-ninja-700 text-xs text-slate-100"
        />
      </div>

      <div>
        <label htmlFor="admin-password" className="block text-[11px] font-semibold text-slate-300 mb-1">
          Şifre
        </label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full h-9 px-3 rounded-lg bg-ninja-950 border border-ninja-700 text-xs text-slate-100"
        />
      </div>

      {error && (
        <div className="px-3 py-2 rounded-lg bg-rose-500/15 border border-rose-500/40 text-xs text-rose-300">
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="h-9 px-3.5 rounded-lg bg-ninja-950 hover:bg-ninja-800 border border-ninja-700 text-xs font-semibold text-slate-300 transition-colors"
          >
            İptal
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading || !configured}
          className="h-9 px-4 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>{isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}</span>
        </button>
      </div>
    </form>
  );
};

interface AdminAuthModalProps {
  isOpen: boolean;
  configured: boolean;
  onClose: () => void;
  onSuccess: (session: AdminSession) => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  configured,
  onClose,
  onSuccess,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-auth-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm bg-ninja-900 border border-ninja-700 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-ninja-700/80 bg-ninja-950/60">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-orange-400" />
            <h2 id="admin-auth-title" className="text-sm font-bold text-slate-100 naruto-title">
              Yönetici Girişi
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-ninja-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4">
          <AdminAuthForm
            configured={configured}
            onSuccess={(session) => {
              onSuccess(session);
              onClose();
            }}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
};
