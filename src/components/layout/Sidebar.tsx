import { NavLink } from 'react-router-dom';
import { Gamepad2, Trophy, Home as HomeIcon, X, Palette } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Simple utility to merge tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: 'Home', path: '/', icon: HomeIcon },
  { name: 'Contrast Checker', path: '/game/contrast', icon: Gamepad2 },
  { name: 'Leaderboard', path: '/leaderboard', icon: Trophy },
];

export default function Sidebar() {
  const { isSidebarOpen, closeSidebar } = useUiStore();

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-[260px] bg-[var(--card)] border-r border-[var(--border)] transition-transform duration-300 ease-in-out px-4 py-6 flex flex-col",
          "md:translate-x-0 md:static md:h-screen md:shrink-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between mb-8 pl-2 pr-1">
          <div className="flex items-center gap-2">
            <div className="bg-[var(--primary)] text-[var(--primary-foreground)] p-1.5 rounded-lg shadow-sm">
              <Palette size={22} className="-rotate-12" />
            </div>
            <span className="font-bold text-xl tracking-tight">DesignSight</span>
          </div>
          
          <button 
            onClick={closeSidebar}
            className="p-1.5 rounded-md text-[var(--secondary-foreground)] hover:bg-[var(--secondary)] md:hidden transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => {
                // close sidebar on mobile when navigating
                if (window.innerWidth < 768) closeSidebar();
              }}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                isActive 
                  ? "bg-[var(--primary)]/10 text-[var(--primary)]" 
                  : "text-[var(--secondary-foreground)] hover:bg-[var(--secondary)]"
              )}
            >
              {({ isActive }) => (
                <>
                  <item.icon 
                    size={18} 
                    className={cn(
                      "transition-transform",
                      isActive ? "scale-110" : "group-hover:scale-110"
                    )} 
                  />
                  {item.name}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto px-3 py-4 bg-[var(--secondary)]/50 rounded-xl">
          <p className="text-xs font-medium text-[var(--secondary-foreground)]">DesignSight v0.1.0</p>
          <p className="text-xs text-[var(--secondary-foreground)]/70 mt-1">Arcade for UI/UX Designers</p>
        </div>
      </aside>
    </>
  );
}
