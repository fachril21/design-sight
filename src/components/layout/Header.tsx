import { useUiStore } from '../../store/uiStore';
import { Menu, Moon, Sun } from 'lucide-react';

export default function Header() {
  const { toggleSidebar, isDarkMode, toggleDarkMode } = useUiStore();

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

      <div className="flex items-center gap-4">
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
