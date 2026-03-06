import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuthStore } from '../stores/auth.store';

interface Stats {
  tracks: number;
  artists: number;
  albums: number;
  folders: number;
  users: number;
  coverSizeBytes: number;
}

interface FolderInfo {
  id: string;
  name: string;
}

interface UserInfo {
  id: string;
  username: string;
  isAdmin: boolean;
  createdAt: string;
  _count: { playlists: number; tags: number; queueItems: number };
  folderAccess: { folderId: string; folder: FolderInfo }[];
}

interface ScannerStatus {
  trackCount: number;
  lastIndexed: string | null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
  return (bytes / 1073741824).toFixed(2) + ' GB';
}

export function AdminPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [scannerStatus, setScannerStatus] = useState<ScannerStatus | null>(null);
  const [resetPasswordId, setResetPasswordId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [scanning, setScanning] = useState(false);
  const [folderAccessUserId, setFolderAccessUserId] = useState<string | null>(null);
  const [rootFolders, setRootFolders] = useState<FolderInfo[]>([]);
  const [selectedFolderIds, setSelectedFolderIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user?.isAdmin) {
      navigate('/');
      return;
    }
    loadAll();
  }, [user]);

  function loadAll() {
    api.get<Stats>('/admin/stats').then(setStats).catch(() => {});
    api.get<{ users: UserInfo[] }>('/admin/users').then(r => setUsers(r.users)).catch(() => {});
    api.get<Record<string, string>>('/admin/settings').then(setSettings).catch(() => {});
    api.get<ScannerStatus>('/admin/scanner/status').then(setScannerStatus).catch(() => {});
  }

  function flash(msg: string) {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  }

  async function toggleRegistration() {
    const newVal = settings.registrationEnabled === 'true' ? 'false' : 'true';
    await api.put('/admin/settings', { registrationEnabled: newVal });
    setSettings({ ...settings, registrationEnabled: newVal });
    flash(`Registration ${newVal === 'true' ? 'enabled' : 'disabled'}`);
  }

  async function toggleAdmin(userId: string, isAdmin: boolean) {
    await api.put(`/admin/users/${userId}/role`, { isAdmin });
    loadAll();
    flash(`Admin role ${isAdmin ? 'granted' : 'revoked'}`);
  }

  async function deleteUser(userId: string, username: string) {
    if (!confirm(`Delete user "${username}"? This will remove all their playlists, tags, and queue.`)) return;
    await api.delete(`/admin/users/${userId}`);
    loadAll();
    flash(`User "${username}" deleted`);
  }

  async function resetPassword() {
    if (!resetPasswordId || newPassword.length < 6) return;
    await api.put(`/admin/users/${resetPasswordId}/password`, { password: newPassword });
    setResetPasswordId(null);
    setNewPassword('');
    flash('Password reset successfully');
  }

  async function triggerRescan() {
    setScanning(true);
    await api.post('/admin/scanner/trigger');
    flash('Rescan triggered. The scanner will re-index your library.');
    setTimeout(() => {
      setScanning(false);
      loadAll();
    }, 5000);
  }

  async function openFolderAccess(userId: string) {
    const u = users.find(u => u.id === userId);
    setFolderAccessUserId(userId);
    setSelectedFolderIds(new Set(u?.folderAccess.map(a => a.folderId) || []));
    if (rootFolders.length === 0) {
      const res = await api.get<{ folders: FolderInfo[] }>('/folders');
      setRootFolders(res.folders);
    }
  }

  function toggleFolderSelection(folderId: string) {
    setSelectedFolderIds(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  }

  async function saveFolderAccess() {
    if (!folderAccessUserId) return;
    await api.put(`/admin/users/${folderAccessUserId}/folders`, { folderIds: [...selectedFolderIds] });
    setFolderAccessUserId(null);
    loadAll();
    flash('Folder access updated');
  }

  if (!user?.isAdmin) return null;

  return (
    <div className="space-y-8 max-w-4xl">
      <h1 className="text-2xl font-bold">Admin</h1>

      {message && (
        <div className="bg-accent-primary/20 text-accent-primary px-4 py-2 rounded-lg text-sm">
          {message}
        </div>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-3">Library Stats</h2>
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { label: 'Tracks', value: stats.tracks },
              { label: 'Artists', value: stats.artists },
              { label: 'Albums', value: stats.albums },
              { label: 'Folders', value: stats.folders },
              { label: 'Users', value: stats.users },
              { label: 'Cover Art', value: formatBytes(stats.coverSizeBytes) },
            ].map(s => (
              <div key={s.label} className="bg-bg-secondary rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-accent-primary">{typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</div>
                <div className="text-xs text-text-secondary">{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Scanner</h2>
        <div className="bg-bg-secondary rounded-xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-sm text-text-secondary">
                Indexed: <span className="text-text-primary">{scannerStatus?.trackCount.toLocaleString() || 0} tracks</span>
              </div>
              {scannerStatus?.lastIndexed && (
                <div className="text-sm text-text-secondary">
                  Last activity: <span className="text-text-primary">{new Date(scannerStatus.lastIndexed).toLocaleString()}</span>
                </div>
              )}
            </div>
            <button
              onClick={triggerRescan}
              disabled={scanning}
              className="px-4 py-2 bg-accent-primary hover:bg-accent-hover text-accent-text disabled:opacity-50 rounded-lg text-sm font-medium transition w-fit"
            >
              {scanning ? 'Scanning...' : 'Rescan Library'}
            </button>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Settings</h2>
        <div className="bg-bg-secondary rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">Open Registration</div>
              <div className="text-xs text-text-secondary">Allow new users to create accounts</div>
            </div>
            <button
              onClick={toggleRegistration}
              className={`relative w-12 h-6 rounded-full transition ${
                settings.registrationEnabled === 'true' ? 'bg-accent-primary' : 'bg-bg-tertiary'
              }`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                settings.registrationEnabled === 'true' ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Users ({users.length})</h2>
        {/* Desktop table */}
        <div className="hidden md:block bg-bg-secondary rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-text-secondary text-left">
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-bg-hover transition">
                  <td className="px-4 py-3 font-medium">{u.username}</td>
                  <td className="px-4 py-3 text-text-secondary">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-text-secondary text-xs">
                    {u._count.playlists} playlists, {u._count.tags} tags
                    {u.folderAccess.length > 0 && (
                      <span className="ml-1 text-yellow-400" title={u.folderAccess.map(a => a.folder.name).join(', ')}>
                        ({u.folderAccess.length} folder{u.folderAccess.length !== 1 ? 's' : ''})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleAdmin(u.id, !u.isAdmin)}
                      disabled={u.id === user.id}
                      className={`px-2 py-0.5 rounded text-xs font-medium transition ${
                        u.isAdmin ? 'bg-accent-primary/20 text-accent-primary' : 'bg-bg-tertiary text-text-secondary hover:bg-bg-hover'
                      } ${u.id === user.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {u.isAdmin ? 'Admin' : 'User'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => openFolderAccess(u.id)} className="text-text-secondary hover:text-accent-primary transition text-xs">Folders</button>
                    <button onClick={() => { setResetPasswordId(u.id); setNewPassword(''); }} className="text-text-secondary hover:text-accent-primary transition text-xs">Reset PW</button>
                    {u.id !== user.id && (
                      <button onClick={() => deleteUser(u.id, u.username)} className="text-text-secondary hover:text-red-400 transition text-xs">Delete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile cards */}
        <div className="md:hidden space-y-2">
          {users.map(u => (
            <div key={u.id} className="bg-bg-secondary rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-medium">{u.username}</div>
                <button
                  onClick={() => toggleAdmin(u.id, !u.isAdmin)}
                  disabled={u.id === user.id}
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    u.isAdmin ? 'bg-accent-primary/20 text-accent-primary' : 'bg-bg-tertiary text-text-secondary'
                  } ${u.id === user.id ? 'opacity-50' : ''}`}
                >
                  {u.isAdmin ? 'Admin' : 'User'}
                </button>
              </div>
              <div className="text-xs text-text-secondary">
                Joined {new Date(u.createdAt).toLocaleDateString()} · {u._count.playlists} playlists, {u._count.tags} tags
              </div>
              <div className="flex gap-3 text-xs">
                <button onClick={() => openFolderAccess(u.id)} className="text-text-secondary hover:text-accent-primary">Folders</button>
                <button onClick={() => { setResetPasswordId(u.id); setNewPassword(''); }} className="text-text-secondary hover:text-accent-primary">Reset Password</button>
                {u.id !== user.id && (
                  <button onClick={() => deleteUser(u.id, u.username)} className="text-text-secondary hover:text-red-400">Delete</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {resetPasswordId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setResetPasswordId(null)}>
          <div className="bg-bg-secondary rounded-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold mb-4">Reset Password</h3>
            <p className="text-sm text-text-secondary mb-3">
              For: {users.find(u => u.id === resetPasswordId)?.username}
            </p>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="New password (min 6 chars)"
              className="w-full px-4 py-2 bg-bg-tertiary rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary mb-4"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setResetPasswordId(null)} className="px-4 py-2 text-sm text-text-secondary hover:text-white transition">
                Cancel
              </button>
              <button
                onClick={resetPassword}
                disabled={newPassword.length < 6}
                className="px-4 py-2 bg-accent-primary hover:bg-accent-hover text-accent-text disabled:opacity-50 rounded-lg text-sm font-medium transition"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {folderAccessUserId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setFolderAccessUserId(null)}>
          <div className="bg-bg-secondary rounded-xl p-6 w-full max-w-sm max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold mb-1">Folder Access</h3>
            <p className="text-sm text-text-secondary mb-4">
              {users.find(u => u.id === folderAccessUserId)?.username} — select which root folders this user can access. Leave all unchecked for unrestricted access.
            </p>
            <div className="space-y-1 overflow-y-auto flex-1 mb-4">
              {rootFolders.map(f => {
                const checked = selectedFolderIds.has(f.id);
                return (
                  <button
                    key={f.id}
                    onClick={() => toggleFolderSelection(f.id)}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg cursor-pointer transition text-left ${
                      checked ? 'bg-accent-primary/10 border border-accent-primary/30' : 'hover:bg-bg-hover border border-transparent'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition ${
                      checked ? 'bg-accent-primary' : 'bg-bg-tertiary border border-border'
                    }`}>
                      {checked && (
                        <svg className="w-3.5 h-3.5 text-accent-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <svg className="w-4 h-4 text-accent-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <span className="text-sm truncate">{f.name}</span>
                  </button>
                );
              })}
              {rootFolders.length === 0 && <div className="text-sm text-text-muted">No folders found</div>}
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setFolderAccessUserId(null)} className="px-4 py-2 text-sm text-text-secondary hover:text-white transition">
                Cancel
              </button>
              <button
                onClick={saveFolderAccess}
                className="px-4 py-2 bg-accent-primary hover:bg-accent-hover text-accent-text rounded-lg text-sm font-medium transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
