import { ReactNode } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 ml-64">
          {children}
        </main>
      </div>
      <footer className="bg-white border-t border-gray-200 ml-64 px-6 py-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            <span>© 2024 AI Personal Finance Mentor</span>
          </div>
          <div>
            <span>Developed by <strong className="text-gray-900">Raj</strong></span>
          </div>
        </div>
      </footer>
    </div>
  );
}