import { create } from 'zustand';

interface UiState {
  isSidebarOpen: boolean;
  isDarkMode: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  toggleDarkMode: () => void;
}

// Read initial dark mode preference from localStorage or matchMedia
const getInitialDarkMode = () => {
  if (typeof window !== 'undefined') {
    const savedMode = localStorage.getItem('theme');
    if (savedMode) {
      return savedMode === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return true; // Default to dark mode for DesignSight
};

export const useUiStore = create<UiState>((set) => ({
  isSidebarOpen: false,
  isDarkMode: getInitialDarkMode(),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  closeSidebar: () => set({ isSidebarOpen: false }),
  toggleDarkMode: () => set((state) => {
    const newMode = !state.isDarkMode;
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newMode ? 'dark' : 'light');
      if (newMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    return { isDarkMode: newMode };
  })
}));
