import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { ToastContainer } from '../ui';

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
      <div className="flex w-full min-w-0">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Mobile Sidebar (Drawer) */}
        <div className="md:hidden">
          <Sidebar />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen min-w-0">
          <Header />

          <main className="flex-1 pb-20 md:pb-6">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNav />

      {/* Toasts */}
      <ToastContainer />
    </div>
  );
};
