'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';

interface BreadcrumbItem {
    label: string;
    path: string;
}

interface NavigationBreadcrumbsProps {
    customItems?: BreadcrumbItem[];
    className?: string;
}

const NavigationBreadcrumbs = ({ customItems, className = '' }: NavigationBreadcrumbsProps) => {
    const pathname = usePathname();

    const generateBreadcrumbs = (): BreadcrumbItem[] => {
        if (customItems) {
            return customItems;
        }

        const pathSegments = pathname.split('/').filter(segment => segment);

        // Determine the base dashboard path based on current route
        let basePath = '/';
        let baseLabel = 'Home';

        if (pathSegments[0] === 'patient-dashboard') {
            basePath = '/patient-dashboard';
            baseLabel = 'Home';
        } else if (pathSegments[0] === 'doctor-dashboard') {
            basePath = '/doctor-dashboard';
            baseLabel = 'Home';
        }

        const breadcrumbs: BreadcrumbItem[] = [{ label: baseLabel, path: basePath }];

        const labelMap: Record<string, string> = {
            'patient-dashboard': 'Patient Dashboard',
            'doctor-dashboard': 'Doctor Dashboard',
            'patient-registration': 'Patient Registration',
            'doctor-registration': 'Doctor Registration',
            'homepage': 'Home',
            'login': 'Login',
            'find-doctors': 'Find Doctors',
            'medical-history': 'Medical History',
            'schedule': 'Schedule',
            'patients': 'Patients',
            'profile': 'Profile',
        };

        let currentPath = '';
        pathSegments.forEach((segment, index) => {
            currentPath += `/${segment}`;

            // Skip adding duplicate home item
            if (index === 0 && (segment === 'patient-dashboard' || segment === 'doctor-dashboard')) {
                return;
            }

            const label = labelMap[segment] || segment.split('-').map(word =>
                word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');

            breadcrumbs.push({
                label,
                path: currentPath,
            });
        });

        return breadcrumbs;
    };

    const breadcrumbs = generateBreadcrumbs();

    if (breadcrumbs.length <= 1) {
        return null;
    }

    return (
        <nav
            aria-label="Breadcrumb"
            className={`py-4 ${className}`}
        >
            <ol className="flex items-center space-x-2 text-sm">
                {breadcrumbs.map((item, index) => {
                    const isLast = index === breadcrumbs.length - 1;
                    const isFirst = index === 0;

                    return (
                        <li key={item.path} className="flex items-center space-x-2">
                            {!isFirst && (
                                <Icon
                                    name="ChevronRightIcon"
                                    size={16}
                                    className="text-text-secondary flex-shrink-0"
                                />
                            )}
                            {isLast ? (
                                <span className="font-medium text-primary truncate max-w-[200px] sm:max-w-none">
                                    {item.label}
                                </span>
                            ) : (
                                <Link
                                    href={item.path}
                                    className="text-text-secondary hover:text-primary transition-base truncate max-w-[150px] sm:max-w-none"
                                >
                                    {item.label}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

export default NavigationBreadcrumbs;