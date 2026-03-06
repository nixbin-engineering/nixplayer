import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomPlayer } from './BottomPlayer';
import { MobileNav } from './MobileNav';
import { SearchBar } from '../shared/SearchBar';
import { usePlaybackSync } from '../../hooks/usePlaybackSync';
import { usePlayerStore } from '../../stores/player.store';

export function AppShell() {
  usePlaybackSync();
  const { currentTrack } = usePlayerStore();

  // Bottom padding: just player height or nothing
  const paddingClass = currentTrack ? 'pb-[80px] md:pb-24' : 'pb-4';

  return (
    <div className="flex min-h-screen bg-bg-primary text-text-primary">
      <Sidebar />
      <MobileNav />
      <main className={`flex-1 min-w-0 ${paddingClass}`}>
        <header className="sticky top-0 z-30 bg-bg-primary/80 backdrop-blur-md border-b border-border/50 px-3 py-2 md:px-4 md:py-3">
          {/* Leave space for hamburger on mobile */}
          <div className="pl-8 md:pl-0">
            <SearchBar />
          </div>
        </header>
        <div className="p-3 md:p-4">
          <Outlet />
        </div>
      </main>
      <BottomPlayer />
    </div>
  );
}
