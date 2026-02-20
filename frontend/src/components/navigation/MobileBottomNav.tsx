'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';

interface NavItem {
  label: string;
  icon: string;
  href: string;
  badge?: number;
}

interface MobileBottomNavProps {
  items: NavItem[];
}

export function MobileBottomNav({ items }: MobileBottomNavProps) {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [currentHash, setCurrentHash] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    const syncHash = () => {
      setCurrentHash(window.location.hash || '');
    };

    syncHash();
    window.addEventListener('hashchange', syncHash);
    return () => window.removeEventListener('hashchange', syncHash);
  }, [pathname]);

  return (
    <nav
      className={`
        fixed bottom-0 left-0 right-0 z-50
        bg-card/95 backdrop-blur-lg border-t border-border
        transform transition-transform duration-300 ease-out
        md:hidden
        ${isVisible ? 'translate-y-0' : 'translate-y-full'}
      `}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {items.map((item) => {
          const [basePath, hashFragment] = item.href.split('#');
          const isActive = hashFragment
            ? pathname === basePath && currentHash === `#${hashFragment}`
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                relative flex flex-col items-center justify-center
                min-w-[64px] py-2 px-3 rounded-lg
                transition-colors duration-200
                ${
                  isActive
                    ? 'text-primary bg-primary/10'
                    : 'text-text-secondary hover:text-text-primary hover:bg-muted'
                }
              `}
            >
              <div className="relative">
                <Icon name={item.icon} size={24} variant={isActive ? 'solid' : 'outline'} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium mt-1">{item.label}</span>
              {isActive && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Safe area padding for iOS */}
      <div className="h-safe-area-inset-bottom" />
    </nav>
  );
}

// Patient navigation items
export const patientNavItems: NavItem[] = [
  { label: 'Home', icon: 'HomeIcon', href: '/patient-dashboard' },
  { label: 'Doctors', icon: 'UserGroupIcon', href: '/patient-dashboard#find-doctors' },
  { label: 'Appointments', icon: 'CalendarIcon', href: '/patient-dashboard#appointments' },
  { label: 'Profile', icon: 'UserCircleIcon', href: '/patient-dashboard/profile' },
];

// Doctor navigation items
export const doctorNavItems: NavItem[] = [
  { label: 'Dashboard', icon: 'HomeIcon', href: '/doctor-dashboard' },
  { label: 'Patients', icon: 'UserGroupIcon', href: '/doctor-dashboard#patients' },
  { label: 'Schedule', icon: 'CalendarIcon', href: '/doctor-dashboard#schedule' },
  { label: 'Profile', icon: 'UserCircleIcon', href: '/doctor-dashboard/profile' },
];

export default MobileBottomNav;
