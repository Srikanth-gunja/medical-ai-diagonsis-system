'use client';

import { useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import { useTheme } from '@/contexts/ThemeContext';

interface PublicHeaderProps {
  className?: string;
}

const PublicHeader = ({ className = '' }: PublicHeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className={`relative bg-card border-b border-border ${className}`}>
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <Link
            href="/homepage"
            className="flex items-center space-x-2 hover:opacity-80 transition-base"
          >
            <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-primary to-accent">
              <Icon name="HeartIcon" variant="solid" size={24} className="text-white" />
            </div>
            <span className="text-xl sm:text-2xl font-heading font-semibold text-primary">
              MediCare
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/homepage"
              className="text-text-primary hover:text-primary transition-base font-medium"
            >
              Home
            </Link>
            <Link
              href="/homepage#services"
              className="text-text-secondary hover:text-primary transition-base font-medium"
            >
              Services
            </Link>
            <Link
              href="/homepage#about"
              className="text-text-secondary hover:text-primary transition-base font-medium"
            >
              About
            </Link>
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 text-text-secondary hover:text-primary hover:bg-muted rounded-lg transition-base"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              <Icon name={theme === 'dark' ? 'SunIcon' : 'MoonIcon'} size={20} />
            </button>
            <Link
              href="/login"
              className="px-6 py-2.5 text-primary font-medium hover:bg-muted rounded-lg transition-base"
            >
              Login
            </Link>
            <Link
              href="/patient-registration"
              className="px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:shadow-elevation-2 active:scale-[0.97] transition-base"
            >
              Get Started
            </Link>
          </div>

          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 text-text-primary hover:bg-muted rounded-lg transition-base"
            aria-label="Toggle mobile menu"
          >
            <Icon name={isMobileMenuOpen ? 'XMarkIcon' : 'Bars3Icon'} size={24} />
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden bg-card border-t border-border animate-fade-in">
          <nav className="container mx-auto px-4 py-4 space-y-2">
            <Link
              href="/homepage"
              className="block px-4 py-3 text-text-primary hover:bg-muted rounded-lg transition-base font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/homepage#services"
              className="block px-4 py-3 text-text-secondary hover:bg-muted rounded-lg transition-base font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Services
            </Link>
            <Link
              href="/homepage#about"
              className="block px-4 py-3 text-text-secondary hover:bg-muted rounded-lg transition-base font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              About
            </Link>
            <div className="pt-4 space-y-2 border-t border-border">
              <button
                onClick={() => {
                  toggleTheme();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center justify-between w-full px-4 py-3 text-text-secondary hover:bg-muted rounded-lg transition-base font-medium"
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                <Icon name={theme === 'dark' ? 'SunIcon' : 'MoonIcon'} size={18} />
              </button>
              <Link
                href="/login"
                className="block px-4 py-3 text-center text-primary font-medium hover:bg-muted rounded-lg transition-base"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                href="/patient-registration"
                className="block px-4 py-3 text-center bg-primary text-primary-foreground font-medium rounded-lg hover:shadow-elevation-2 active:scale-[0.97] transition-base"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Get Started
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default PublicHeader;
