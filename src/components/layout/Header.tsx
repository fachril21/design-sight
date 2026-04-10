import { useUiStore } from '../../store/uiStore';
import { Menu, Moon, Sun } from 'lucide-react';

export default function Header() {
  const { toggleSidebar, isDarkMode, toggleDarkMode } = useUiStore();

  return (
    <header className="h-16 px-6 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between transition-colors">
      <div className="flex items-center">
        <button 
          onClick={toggleSidebar}
          className="p-2 -ml-2 rounded-md hover:bg-[var(--secondary)] text-[var(--foreground)] md:hidden transition-colors"
          aria-label="Toggle Menu"
        >
          <Menu size={20} />
        </button>
      </div>

      <div className="flex items-center gap-4">
        {/* We can add profile or stats here later */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full hover:bg-[var(--secondary)] text-[var(--foreground)] transition-colors"
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
