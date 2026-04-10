import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { UsernameModal } from '../ui/UsernameModal';

export default function Shell() {
  return (
    <div className="flex min-h-screen bg-[var(--background)] text-[var(--foreground)] w-full antialiased font-sans transition-colors duration-300">
      <UsernameModal />
      <Sidebar />
      <div className="flex-1 flex flex-col w-full h-screen overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto w-full">
          <div className="container mx-auto px-4 md:px-8 py-8 max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
