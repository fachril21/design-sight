import { useUiStore } from '../../store/uiStore';
import { useUserStore } from '../../store/userStore';
import { Menu, Moon, Sun, Volume2, VolumeX, Vibrate, VibrateOff } from 'lucide-react';
import { ConnectionStatus } from '../ConnectionStatus';

export default function Header() {
  const { toggleSidebar, isDarkMode, toggleDarkMode } = useUiStore();
  const { soundEnabled, toggleSound, hapticsEnabled, toggleHaptics } = useUserStore();

  return (
    <header className="h-16 px-6 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between transition-colors">
      <div className="flex items-center">
        <button 
          onClick={toggleSidebar}
          className="p-2 -ml-2 rounded-md hover:bg-surface text-foreground md:hidden transition-colors"
          aria-label="Toggle Menu"
        >
          <Menu size={20} />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <ConnectionStatus />
        <div className="w-px h-6 bg-border mx-1 hidden sm:block" />
        <button
          onClick={toggleSound}
          className="p-2 rounded-full hover:bg-surface text-text-primary transition-colors"
          aria-label={soundEnabled ? "Disable Sound" : "Enable Sound"}
        >
          {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} className="text-text-secondary" />}
        </button>
        <button
          onClick={toggleHaptics}
          className="p-2 rounded-full hover:bg-surface text-text-primary transition-colors"
          aria-label={hapticsEnabled ? "Disable Haptics" : "Enable Haptics"}
        >
          {hapticsEnabled ? <Vibrate size={18} /> : <VibrateOff size={18} className="text-text-secondary" />}
        </button>
        <div className="w-px h-6 bg-border mx-2" />
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full hover:bg-surface text-text-primary transition-colors"
          aria-label="Toggle Dark Mode"
        >
          {isDarkMode ? (
            <Moon size={18} className="text-yellow-400 fill-yellow-400/20" />
          ) : (
            <Sun size={18} className="text-orange-500 fill-orange-500/20" />
          )}
        </button>
      </div>
    </header>
  );
}
