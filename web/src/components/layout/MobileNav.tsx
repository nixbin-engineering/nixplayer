import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';

const browseItems = [
  { to: '/', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', label: 'Home' },
  { to: '/folders', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z', label: 'Folders' },
  { to: '/artists', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', label: 'Artists' },
  { to: '/albums', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', label: 'Albums' },
];

const libraryItems = [
  { to: '/playlists', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', label: 'Playlists' },
  { to: '/tags', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z', label: 'Tags' },
  { to: '/search', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', label: 'Search' },
  { to: '/queue', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16', label: 'Queue' },
];

function MobileNavLink({ to, icon, label, onClick }: { to: string; icon: string; label: string; onClick: () => void }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
          isActive
            ? 'bg-accent-primary/15 text-accent-primary font-medium'
            : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
        }`
      }
    >
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
      </svg>
      {label}
    </NavLink>
  );
}

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const { logout, user } = useAuthStore();
  const close = () => setOpen(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-2.5 left-3 z-40 p-1.5 text-text-secondary hover:text-text-primary transition"
        aria-label="Open menu"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {open && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-50" onClick={close} />
      )}

      <div
        className={`md:hidden fixed top-0 left-0 bottom-0 w-64 bg-bg-secondary border-r border-border z-50 transform transition-transform duration-200 flex flex-col ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4">
          <h1 className="text-lg font-bold text-accent-primary tracking-tight">NT Music</h1>
          <button onClick={close} className="p-1 text-text-secondary hover:text-text-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 px-3 overflow-y-auto space-y-5">
          <div>
            <div className="px-3 mb-1.5 text-[11px] font-semibold text-text-muted uppercase tracking-wider">Browse</div>
            <div className="space-y-0.5">
              {browseItems.map((item) => (
                <MobileNavLink key={item.to} {...item} onClick={close} />
              ))}
            </div>
          </div>

          <div>
            <div className="px-3 mb-1.5 text-[11px] font-semibold text-text-muted uppercase tracking-wider">Library</div>
            <div className="space-y-0.5">
              {libraryItems.map((item) => (
                <MobileNavLink key={item.to} {...item} onClick={close} />
              ))}
            </div>
          </div>

          <div>
            <div className="px-3 mb-1.5 text-[11px] font-semibold text-text-muted uppercase tracking-wider">System</div>
            <div className="space-y-0.5">
              {user?.isAdmin && (
                <MobileNavLink
                  to="/admin"
                  icon="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  label="Admin"
                  onClick={close}
                />
              )}
              <MobileNavLink
                to="/settings"
                icon="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                label="Settings"
                onClick={close}
              />
              <button
                onClick={logout}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
              >
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </nav>
      </div>
    </>
  );
}
