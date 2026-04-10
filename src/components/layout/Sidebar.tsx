import { NavLink } from 'react-router-dom';
import { Gamepad2, Trophy, Home as HomeIcon, X, Palette } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';
import { cn } from '../../lib/utils';

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
          "fixed top-0 left-0 z-50 h-full w-[260px] bg-surface border-r border-border transition-transform duration-300 ease-in-out px-4 py-6 flex flex-col",
          "md:translate-x-0 md:static md:h-screen md:shrink-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between mb-8 pl-2 pr-1">
          <div className="flex items-center gap-2">
            <div className="bg-accent text-white p-1.5 rounded-lg shadow-sm">
              <Palette size={22} className="-rotate-12" />
            </div>
            <span className="font-bold text-xl tracking-tight text-text-primary">DesignSight</span>
          </div>
          
          <button 
            onClick={closeSidebar}
            className="p-1.5 rounded-md text-text-secondary hover:bg-background md:hidden transition-colors"
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
                if (window.innerWidth < 768) closeSidebar();
              }}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                isActive 
                  ? "bg-accent/10 text-accent" 
                  : "text-text-secondary hover:bg-background"
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

        <div className="mt-auto px-3 py-4 bg-background/50 rounded-xl">
          <p className="text-xs font-medium text-text-secondary">DesignSight v0.1.0</p>
          <p className="text-xs text-text-secondary/70 mt-1">Arcade for UI/UX Designers</p>
        </div>
      </aside>
    </>
  );
}
