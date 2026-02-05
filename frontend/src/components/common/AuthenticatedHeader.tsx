'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';
import { notificationsApi, type Notification } from '@/lib/api';

interface User {
  name: string;
  role: 'patient' | 'doctor';
  avatar?: string;
}

interface AuthenticatedHeaderProps {
  user: User;
  notificationCount?: number;
  onLogout?: () => void;
  className?: string;
}

const AuthenticatedHeader = ({
  user,
  notificationCount = 0,
  onLogout,
  className = '',
}: AuthenticatedHeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [localNotificationCount, setLocalNotificationCount] = useState(notificationCount);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [, setTimeTick] = useState(0);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalNotificationCount(notificationCount);
  }, [notificationCount]);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Re-render periodically to update "time ago" labels
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeTick((prev) => prev + 1);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setIsProfileMenuOpen(false);
    setIsNotificationsOpen(false);
  };

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
    setIsNotificationsOpen(false);
  };

  const toggleNotifications = async () => {
    if (!isNotificationsOpen) {
      setIsLoadingNotifications(true);
      try {
        const data = await notificationsApi.getAll(10);
        setNotifications(data.notifications);
        setLocalNotificationCount(data.unreadCount);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      } finally {
        setIsLoadingNotifications(false);
      }
    }
    setIsNotificationsOpen(!isNotificationsOpen);
    setIsProfileMenuOpen(false);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationsApi.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setLocalNotificationCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setLocalNotificationCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleLogout = () => {
    setIsProfileMenuOpen(false);
    setIsMobileMenuOpen(false);
    if (onLogout) {
      onLogout();
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return 'CalendarIcon';
      case 'message':
        return 'ChatBubbleLeftRightIcon';
      case 'prescription':
        return 'ClipboardDocumentListIcon';
      case 'success':
        return 'CheckCircleIcon';
      case 'warning':
        return 'ExclamationTriangleIcon';
      case 'error':
        return 'XCircleIcon';
      default:
        return 'BellIcon';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'appointment':
        return 'text-primary';
      case 'message':
        return 'text-accent';
      case 'prescription':
        return 'text-accent';
      case 'success':
        return 'text-success';
      case 'warning':
        return 'text-warning';
      case 'error':
        return 'text-error';
      default:
        return 'text-text-secondary';
    }
  };

  const normalizeIsoToUtc = (value: string) => {
    // If the string has no timezone offset, treat it as UTC
    if (!value) return value;
    const hasTimezone = /[zZ]|[+-]\d{2}:\d{2}$/.test(value);
    return hasTimezone ? value : `${value}Z`;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(normalizeIsoToUtc(dateString));
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const patientNavItems = [
    { label: 'Dashboard', path: '/patient-dashboard', icon: 'HomeIcon' },
    { label: 'Find Doctors', path: '/patient-dashboard#find-doctors', icon: 'MagnifyingGlassIcon' },
    {
      label: 'Medical History',
      path: '/patient-dashboard/medical-history',
      icon: 'DocumentTextIcon',
    },
    { label: 'Profile', path: '/patient-dashboard/profile', icon: 'UserIcon' },
  ];

  const doctorNavItems = [
    { label: 'Dashboard', path: '/doctor-dashboard', icon: 'HomeIcon' },
    { label: 'Schedule', path: '/doctor-dashboard#schedule', icon: 'CalendarIcon' },
    { label: 'Patients', path: '/doctor-dashboard#patients', icon: 'UsersIcon' },
    { label: 'Profile', path: '/doctor-dashboard#profile', icon: 'UserIcon' },
  ];

  const navItems = user.role === 'patient' ? patientNavItems : doctorNavItems;

  return (
    <header
      className={`sticky top-0 z-40 bg-card border-b border-border shadow-elevation-1 ${className}`}
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link
              href={user.role === 'patient' ? '/patient-dashboard' : '/doctor-dashboard'}
              className="flex items-center space-x-2 hover:opacity-80 transition-base"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent">
                <Icon name="HeartIcon" variant="solid" size={20} className="text-white" />
              </div>
              <span className="text-xl font-heading font-semibold text-primary hidden sm:block">
                MediCare
              </span>
            </Link>

            <nav className="hidden lg:flex items-center space-x-1">
              {navItems.slice(0, 4).map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className="flex items-center space-x-2 px-4 py-2 text-text-secondary hover:text-primary hover:bg-muted rounded-lg transition-base font-medium"
                >
                  <Icon name={item.icon as any} size={20} />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={toggleNotifications}
                className="relative p-2 text-text-secondary hover:text-primary hover:bg-muted rounded-lg transition-base"
                aria-label="Notifications"
              >
                <Icon name="BellIcon" size={24} />
                {localNotificationCount > 0 && (
                  <span className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-error rounded-full">
                    {localNotificationCount > 9 ? '9+' : localNotificationCount}
                  </span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-card border border-border rounded-xl shadow-elevation-3 animate-fade-in overflow-hidden">
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                    <h3 className="font-semibold text-text-primary">Notifications</h3>
                    {localNotificationCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-xs text-primary hover:text-primary/80 font-medium"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {isLoadingNotifications ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      </div>
                    ) : notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                          className={`px-4 py-3 border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer transition-base ${!notification.read ? 'bg-primary/5' : ''}`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`mt-0.5 ${getNotificationColor(notification.type)}`}>
                              <Icon
                                name={getNotificationIcon(notification.type) as any}
                                size={18}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm ${!notification.read ? 'font-medium text-text-primary' : 'text-text-secondary'}`}
                              >
                                {notification.title}
                              </p>
                              <p className="text-xs text-text-tertiary mt-0.5 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-text-tertiary mt-1">
                                {formatTimeAgo(notification.createdAt)}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center">
                        <Icon
                          name="BellSlashIcon"
                          size={40}
                          className="mx-auto text-text-tertiary mb-3"
                        />
                        <p className="text-text-secondary text-sm">No notifications yet</p>
                        <p className="text-text-tertiary text-xs mt-1">
                          We&apos;ll notify you when something arrives
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative hidden sm:block">
              <button
                onClick={toggleProfileMenu}
                className="flex items-center space-x-2 p-1.5 hover:bg-muted rounded-lg transition-base"
                aria-label="User menu"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-muted">
                  <AppImage
                    src={user.avatar || '/assets/images/default-avatar.png'}
                    alt={user.name}
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                </div>
                <Icon name="ChevronDownIcon" size={16} className="text-text-secondary" />
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-elevation-3 animate-fade-in overflow-hidden">
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-medium text-text-primary">{user.name}</p>
                    <p className="text-xs text-text-secondary capitalize">{user.role}</p>
                  </div>
                  <div className="py-2">
                    <Link
                      href={
                        user.role === 'patient'
                          ? '/patient-dashboard/profile'
                          : '/doctor-dashboard/profile'
                      }
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-text-secondary hover:bg-muted transition-base"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <Icon name="UserIcon" size={16} />
                      <span>Profile Settings</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-error hover:bg-muted transition-base"
                    >
                      <Icon name="ArrowRightOnRectangleIcon" size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 text-text-primary hover:bg-muted rounded-lg transition-base"
              aria-label="Toggle mobile menu"
            >
              <Icon name={isMobileMenuOpen ? 'XMarkIcon' : 'Bars3Icon'} size={24} />
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="lg:hidden bg-card border-t border-border animate-slide-in-right">
          <nav className="container mx-auto px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className="flex items-center space-x-3 px-4 py-3 text-text-secondary hover:text-primary hover:bg-muted rounded-lg transition-base font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Icon name={item.icon as any} size={20} />
                <span>{item.label}</span>
              </Link>
            ))}
            <div className="pt-4 space-y-2 border-t border-border">
              <div className="flex items-center space-x-3 px-4 py-2">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-muted">
                  <AppImage
                    src={user.avatar || '/assets/images/default-avatar.png'}
                    alt={user.name}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{user.name}</p>
                  <p className="text-xs text-text-secondary capitalize">{user.role}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 w-full px-4 py-3 text-error hover:bg-muted rounded-lg transition-base font-medium"
              >
                <Icon name="ArrowRightOnRectangleIcon" size={20} />
                <span>Logout</span>
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default AuthenticatedHeader;
