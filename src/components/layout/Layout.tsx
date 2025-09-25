import { ReactNode, useState } from 'react';
import ResponsiveNavbar from '../navigation/ResponsiveNavbar';
import Sidebar from './Sidebar';
import PageTransition from '../navigation/PageTransition';
import { PageErrorBoundary } from '../ui/ErrorBoundary';
import { NotificationContainer } from '@/contexts/NotificationContext';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Responsive Navbar */}
      <ResponsiveNavbar
        onMobileMenuToggle={toggleMobileMenu}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 pt-16">
        {/* Sidebar */}
        <Sidebar
          isOpen={isMobileMenuOpen}
          onToggle={toggleMobileMenu}
        />

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 transition-all duration-300">
          <div className="p-4 sm:p-6">
            <PageErrorBoundary>
              <PageTransition>
                {children}
              </PageTransition>
            </PageErrorBoundary>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 lg:ml-64 transition-all duration-300">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 text-sm text-gray-600">
            <div>
              <span>© 2024 AI Personal Finance Mentor</span>
            </div>
            <div>
              <span>Developed by <strong className="text-gray-900">Raj</strong></span>
            </div>
          </div>
        </div>
      </footer>

      {/* Toast Notifications */}
      <NotificationContainer />
    </div>
  );
}