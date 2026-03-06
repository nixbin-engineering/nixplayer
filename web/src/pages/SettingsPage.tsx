import { useState } from 'react';
import { api } from '../api/client';
import { useAuthStore } from '../stores/auth.store';
import { useThemeStore } from '../stores/theme.store';

export function SettingsPage() {
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setSaving(true);
    try {
      await api.put('/auth/password', { currentPassword, newPassword });
      setMessage('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Account Info */}
      <section className="bg-bg-secondary rounded-xl p-5 border border-border">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Account</h2>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-accent-primary/20 flex items-center justify-center text-accent-primary font-bold text-lg">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <div className="font-medium">{user?.username}</div>
            <div className="text-sm text-text-muted">{user?.isAdmin ? 'Administrator' : 'User'}</div>
          </div>
        </div>
      </section>

      {/* Theme */}
      <section className="bg-bg-secondary rounded-xl p-5 border border-border">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Appearance</h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Theme</div>
            <div className="text-sm text-text-muted">
              {theme === 'midnight' ? 'Midnight — Indigo & purple tones' : 'Hacker — Green on black'}
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="px-4 py-2 bg-bg-tertiary border border-border rounded-lg text-sm hover:bg-bg-hover transition"
          >
            {theme === 'midnight' ? 'Switch to Hacker' : 'Switch to Midnight'}
          </button>
        </div>
      </section>

      {/* Change Password */}
      <section className="bg-bg-secondary rounded-xl p-5 border border-border">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Change Password</h2>
        <form onSubmit={handlePasswordChange} className="space-y-3">
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Current password"
            className="w-full px-4 py-2.5 bg-bg-tertiary rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary border border-border"
            required
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password (min 6 characters)"
            className="w-full px-4 py-2.5 bg-bg-tertiary rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary border border-border"
            required
            minLength={6}
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            className="w-full px-4 py-2.5 bg-bg-tertiary rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary border border-border"
            required
            minLength={6}
          />
          {error && <div className="text-red-400 text-sm">{error}</div>}
          {message && <div className="text-green-400 text-sm">{message}</div>}
          <button
            type="submit"
            disabled={saving || !currentPassword || !newPassword || !confirmPassword}
            className="px-5 py-2.5 bg-accent-primary hover:bg-accent-hover text-accent-text rounded-lg text-sm font-medium transition disabled:opacity-50"
          >
            {saving ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </section>
    </div>
  );
}
