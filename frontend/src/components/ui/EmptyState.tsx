'use client';

import Icon from '@/components/ui/AppIcon';

interface EmptyStateProps {
  type: 
    | 'appointments' 
    | 'patients' 
    | 'doctors' 
    | 'notifications' 
    | 'search' 
    | 'completed' 
    | 'requests' 
    | 'prescriptions' 
    | 'messages' 
    | 'history' 
    | 'calendar' 
    | 'error'
    | 'no-results';
  title?: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const EmptyStateIllustration = ({ type }: { type: EmptyStateProps['type'] }) => {
  const illustrations = {
    appointments: (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <linearGradient id="calendarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0B4F6C" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#00A8CC" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        {/* Calendar base */}
        <rect x="50" y="40" width="100" height="100" rx="12" fill="url(#calendarGradient)" stroke="#0B4F6C" strokeWidth="2" strokeOpacity="0.3"/>
        {/* Calendar header */}
        <rect x="50" y="40" width="100" height="30" rx="12" fill="#0B4F6C" fillOpacity="0.2"/>
        <rect x="50" y="55" width="100" height="15" fill="#0B4F6C" fillOpacity="0.2"/>
        {/* Calendar dots */}
        <circle cx="70" cy="95" r="6" fill="#00A8CC" fillOpacity="0.4"/>
        <circle cx="100" cy="95" r="6" fill="#0B4F6C" fillOpacity="0.2"/>
        <circle cx="130" cy="95" r="6" fill="#0B4F6C" fillOpacity="0.2"/>
        <circle cx="70" cy="115" r="6" fill="#0B4F6C" fillOpacity="0.2"/>
        <circle cx="100" cy="115" r="6" fill="#00A8CC" fillOpacity="0.4"/>
        {/* Plus icon */}
        <circle cx="150" cy="150" r="25" fill="#00A8CC" fillOpacity="0.2" stroke="#00A8CC" strokeWidth="2"/>
        <path d="M150 138 v24 M138 150 h24" stroke="#00A8CC" strokeWidth="3" strokeLinecap="round"/>
      </svg>
    ),
    patients: (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <linearGradient id="usersGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0B4F6C" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00A8CC" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        {/* User 1 */}
        <circle cx="100" cy="65" r="25" fill="url(#usersGradient)" stroke="#0B4F6C" strokeWidth="2" strokeOpacity="0.3"/>
        <circle cx="100" cy="55" r="12" fill="#0B4F6C" fillOpacity="0.2"/>
        <ellipse cx="100" cy="80" rx="18" ry="12" fill="#0B4F6C" fillOpacity="0.2"/>
        {/* User 2 */}
        <circle cx="65" cy="110" r="20" fill="url(#usersGradient)" stroke="#0B4F6C" strokeWidth="2" strokeOpacity="0.2"/>
        <circle cx="65" cy="102" r="10" fill="#0B4F6C" fillOpacity="0.15"/>
        <ellipse cx="65" cy="122" rx="15" ry="10" fill="#0B4F6C" fillOpacity="0.15"/>
        {/* User 3 */}
        <circle cx="135" cy="110" r="20" fill="url(#usersGradient)" stroke="#0B4F6C" strokeWidth="2" strokeOpacity="0.2"/>
        <circle cx="135" cy="102" r="10" fill="#0B4F6C" fillOpacity="0.15"/>
        <ellipse cx="135" cy="122" rx="15" ry="10" fill="#0B4F6C" fillOpacity="0.15"/>
        {/* Connection lines */}
        <path d="M85 85 Q100 100 115 85" stroke="#00A8CC" strokeWidth="2" fill="none" strokeOpacity="0.3"/>
        <path d="M75 125 Q100 140 125 125" stroke="#00A8CC" strokeWidth="2" fill="none" strokeOpacity="0.3"/>
      </svg>
    ),
    doctors: (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <linearGradient id="doctorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0B4F6C" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00A8CC" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        {/* Stethoscope */}
        <path d="M70 130 Q70 160 100 160 Q130 160 130 130" stroke="#0B4F6C" strokeWidth="3" fill="none" strokeOpacity="0.3"/>
        <circle cx="70" cy="125" r="8" fill="#0B4F6C" fillOpacity="0.3"/>
        <circle cx="130" cy="125" r="8" fill="#0B4F6C" fillOpacity="0.3"/>
        <rect x="95" y="150" width="10" height="20" rx="2" fill="#00A8CC" fillOpacity="0.4"/>
        {/* Doctor avatar */}
        <circle cx="100" cy="80" r="35" fill="url(#doctorGradient)" stroke="#0B4F6C" strokeWidth="2" strokeOpacity="0.3"/>
        <circle cx="100" cy="70" r="15" fill="#0B4F6C" fillOpacity="0.2"/>
        <path d="M75 95 Q100 115 125 95" stroke="#0B4F6C" strokeWidth="2" fill="none" strokeOpacity="0.2"/>
        {/* Medical cross */}
        <rect x="140" y="40" width="30" height="30" rx="4" fill="#00A8CC" fillOpacity="0.2"/>
        <path d="M155 48 v14 M148 55 h14" stroke="#00A8CC" strokeWidth="3" strokeLinecap="round"/>
      </svg>
    ),
    notifications: (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <linearGradient id="bellGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0B4F6C" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00A8CC" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        {/* Bell */}
        <path d="M100 40 L100 35" stroke="#0B4F6C" strokeWidth="3" strokeOpacity="0.3"/>
        <circle cx="100" cy="32" r="4" fill="#0B4F6C" fillOpacity="0.3"/>
        <path d="M70 80 Q70 45 100 45 Q130 45 130 80 L130 120 L140 135 L60 135 L70 120 Z" 
              fill="url(#bellGradient)" stroke="#0B4F6C" strokeWidth="2" strokeOpacity="0.3"/>
        {/* Check mark */}
        <circle cx="140" cy="150" r="20" fill="#10B981" fillOpacity="0.2"/>
        <path d="M132 150 L138 156 L148 144" stroke="#10B981" strokeWidth="3" fill="none" strokeLinecap="round"/>
      </svg>
    ),
    search: (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <linearGradient id="searchGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0B4F6C" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00A8CC" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        {/* Search circle */}
        <circle cx="95" cy="95" r="50" fill="none" stroke="#0B4F6C" strokeWidth="2" strokeOpacity="0.2"/>
        <circle cx="95" cy="95" r="40" fill="url(#searchGradient)" stroke="#0B4F6C" strokeWidth="2" strokeOpacity="0.3"/>
        {/* Magnifying glass handle */}
        <path d="M133 133 L160 160" stroke="#0B4F6C" strokeWidth="6" strokeLinecap="round" strokeOpacity="0.3"/>
        <circle cx="160" cy="160" r="8" fill="#00A8CC" fillOpacity="0.4"/>
        {/* Small dots representing search */}
        <circle cx="85" cy="85" r="4" fill="#0B4F6C" fillOpacity="0.2"/>
        <circle cx="105" cy="85" r="4" fill="#0B4F6C" fillOpacity="0.2"/>
        <circle cx="95" cy="105" r="4" fill="#00A8CC" fillOpacity="0.4"/>
      </svg>
    ),
    completed: (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <linearGradient id="checkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        {/* Main circle */}
        <circle cx="100" cy="100" r="60" fill="url(#checkGradient)" stroke="#10B981" strokeWidth="2" strokeOpacity="0.3"/>
        {/* Check mark */}
        <path d="M75 100 L90 115 L125 80" stroke="#10B981" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        {/* Confetti */}
        <rect x="50" y="50" width="8" height="8" rx="2" fill="#00A8CC" fillOpacity="0.4" transform="rotate(45 54 54)"/>
        <rect x="145" y="60" width="6" height="6" rx="2" fill="#0B4F6C" fillOpacity="0.3" transform="rotate(30 148 63)"/>
        <rect x="60" y="140" width="6" height="6" rx="2" fill="#00A8CC" fillOpacity="0.4" transform="rotate(-20 63 143)"/>
        <rect x="140" y="130" width="8" height="8" rx="2" fill="#0B4F6C" fillOpacity="0.3" transform="rotate(60 144 134)"/>
      </svg>
    ),
    requests: (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <linearGradient id="requestGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#D97706" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        {/* Envelope */}
        <rect x="50" y="70" width="100" height="70" rx="8" fill="url(#requestGradient)" stroke="#F59E0B" strokeWidth="2" strokeOpacity="0.4"/>
        {/* Envelope flap */}
        <path d="M50 70 L100 110 L150 70" stroke="#F59E0B" strokeWidth="2" fill="none" strokeOpacity="0.4"/>
        {/* Clock icon */}
        <circle cx="100" cy="50" r="20" fill="#F59E0B" fillOpacity="0.2" stroke="#F59E0B" strokeWidth="2" strokeOpacity="0.4"/>
        <path d="M100 40 L100 50 L108 55" stroke="#F59E0B" strokeWidth="2" fill="none" strokeLinecap="round"/>
        {/* Status dots */}
        <circle cx="70" cy="160" r="4" fill="#F59E0B" fillOpacity="0.3"/>
        <circle cx="85" cy="160" r="4" fill="#F59E0B" fillOpacity="0.5"/>
        <circle cx="100" cy="160" r="4" fill="#F59E0B" fillOpacity="0.7"/>
      </svg>
    ),
    prescriptions: (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <linearGradient id="prescriptionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0B4F6C" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00A8CC" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        {/* Clipboard */}
        <rect x="60" y="40" width="80" height="110" rx="8" fill="url(#prescriptionGradient)" stroke="#0B4F6C" strokeWidth="2" strokeOpacity="0.3"/>
        <rect x="75" y="35" width="50" height="15" rx="4" fill="#0B4F6C" fillOpacity="0.3"/>
        {/* Lines on clipboard */}
        <rect x="75" y="70" width="50" height="4" rx="2" fill="#0B4F6C" fillOpacity="0.2"/>
        <rect x="75" y="85" width="35" height="4" rx="2" fill="#0B4F6C" fillOpacity="0.2"/>
        <rect x="75" y="100" width="45" height="4" rx="2" fill="#0B4F6C" fillOpacity="0.2"/>
        {/* RX symbol */}
        <circle cx="140" cy="145" r="25" fill="#00A8CC" fillOpacity="0.2"/>
        <text x="140" y="153" textAnchor="middle" fill="#00A8CC" fontSize="20" fontWeight="bold" fontFamily="serif">Rx</text>
      </svg>
    ),
    messages: (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <linearGradient id="messageGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0B4F6C" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00A8CC" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        {/* Chat bubbles */}
        <rect x="40" y="50" width="80" height="50" rx="12" fill="url(#messageGradient)" stroke="#0B4F6C" strokeWidth="2" strokeOpacity="0.3"/>
        <path d="M50 100 L60 115 L70 100" fill="#0B4F6C" fillOpacity="0.2"/>
        <rect x="80" y="110" width="80" height="40" rx="12" fill="#00A8CC" fillOpacity="0.2" stroke="#00A8CC" strokeWidth="2" strokeOpacity="0.3"/>
        <path d="M140 150 L150 165 L160 150" fill="#00A8CC" fillOpacity="0.2"/>
        {/* Lines in bubbles */}
        <rect x="55" y="65" width="50" height="4" rx="2" fill="#0B4F6C" fillOpacity="0.2"/>
        <rect x="55" y="78" width="35" height="4" rx="2" fill="#0B4F6C" fillOpacity="0.2"/>
        <rect x="95" y="125" width="40" height="4" rx="2" fill="#00A8CC" fillOpacity="0.4"/>
      </svg>
    ),
    history: (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <linearGradient id="historyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0B4F6C" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00A8CC" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        {/* Clock */}
        <circle cx="100" cy="100" r="50" fill="url(#historyGradient)" stroke="#0B4F6C" strokeWidth="2" strokeOpacity="0.3"/>
        {/* Clock hands */}
        <path d="M100 100 L100 65" stroke="#0B4F6C" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.4"/>
        <path d="M100 100 L125 100" stroke="#0B4F6C" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.4"/>
        {/* Arrow around clock */}
        <path d="M145 100 Q145 145 100 145 Q55 145 55 100" stroke="#00A8CC" strokeWidth="2" fill="none" strokeOpacity="0.4"/>
        <polygon points="50,100 58,95 58,105" fill="#00A8CC" fillOpacity="0.4"/>
      </svg>
    ),
    calendar: (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <linearGradient id="calendarEmptyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0B4F6C" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00A8CC" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        {/* Calendar */}
        <rect x="50" y="50" width="100" height="100" rx="12" fill="url(#calendarEmptyGradient)" stroke="#0B4F6C" strokeWidth="2" strokeOpacity="0.3"/>
        {/* Calendar header */}
        <rect x="50" y="50" width="100" height="30" rx="12" fill="#0B4F6C" fillOpacity="0.2"/>
        <rect x="50" y="65" width="100" height="15" fill="#0B4F6C" fillOpacity="0.2"/>
        {/* Empty grid */}
        <rect x="65" y="100" width="15" height="15" rx="2" fill="#0B4F6C" fillOpacity="0.1"/>
        <rect x="90" y="100" width="15" height="15" rx="2" fill="#0B4F6C" fillOpacity="0.1"/>
        <rect x="115" y="100" width="15" height="15" rx="2" fill="#0B4F6C" fillOpacity="0.1"/>
        <rect x="65" y="120" width="15" height="15" rx="2" fill="#0B4F6C" fillOpacity="0.1"/>
        <rect x="90" y="120" width="15" height="15" rx="2" fill="#0B4F6C" fillOpacity="0.1"/>
        <rect x="115" y="120" width="15" height="15" rx="2" fill="#0B4F6C" fillOpacity="0.1"/>
      </svg>
    ),
    error: (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <linearGradient id="errorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#DC2626" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#EF4444" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        {/* Error circle */}
        <circle cx="100" cy="100" r="50" fill="url(#errorGradient)" stroke="#DC2626" strokeWidth="2" strokeOpacity="0.3"/>
        {/* X mark */}
        <path d="M80 80 L120 120 M120 80 L80 120" stroke="#DC2626" strokeWidth="4" fill="none" strokeLinecap="round"/>
        {/* Warning icons */}
        <circle cx="60" cy="60" r="3" fill="#DC2626" fillOpacity="0.3"/>
        <circle cx="140" cy="60" r="3" fill="#DC2626" fillOpacity="0.3"/>
        <circle cx="60" cy="140" r="3" fill="#DC2626" fillOpacity="0.3"/>
        <circle cx="140" cy="140" r="3" fill="#DC2626" fillOpacity="0.3"/>
      </svg>
    ),
    'no-results': (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <linearGradient id="noResultsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#64748B" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#94A3B8" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        {/* Magnifying glass */}
        <circle cx="95" cy="95" r="40" fill="url(#noResultsGradient)" stroke="#64748B" strokeWidth="2" strokeOpacity="0.4"/>
        <path d="M125 125 L150 150" stroke="#64748B" strokeWidth="4" strokeLinecap="round" strokeOpacity="0.4"/>
        {/* Question mark */}
        <text x="95" y="105" textAnchor="middle" fill="#64748B" fontSize="35" fontWeight="bold">?</text>
      </svg>
    ),
  };

  return illustrations[type] || illustrations.search;
};

const defaultMessages: Record<EmptyStateProps['type'], { title: string; message: string }> = {
  appointments: {
    title: 'No Appointments',
    message: 'You have no appointments scheduled for today. Your upcoming appointments will appear here.',
  },
  patients: {
    title: 'No Patients Yet',
    message: 'Start by viewing patient profiles and managing their care. Patients with appointments will appear here.',
  },
  doctors: {
    title: 'No Doctors Available',
    message: 'Our team of doctors is currently updating their schedules. Please check back soon.',
  },
  notifications: {
    title: 'All Caught Up',
    message: 'You have no new notifications. We will notify you when something important happens.',
  },
  search: {
    title: 'Start Searching',
    message: 'Enter search terms to find appointments, patients, or medical records.',
  },
  completed: {
    title: 'No Completed Appointments',
    message: 'Your completed consultations will appear here. Start consulting with patients to see your history.',
  },
  requests: {
    title: 'No Pending Requests',
    message: 'You have no pending appointment requests. New patient requests will appear here for your approval.',
  },
  prescriptions: {
    title: 'No Prescriptions',
    message: 'Prescriptions you write for patients will appear here. Start consulting to create prescriptions.',
  },
  messages: {
    title: 'No Messages',
    message: 'Your chat history with patients will appear here. Start a conversation to communicate securely.',
  },
  history: {
    title: 'No History Yet',
    message: 'Patient consultation history and medical records will appear here once you have appointments.',
  },
  calendar: {
    title: 'Calendar is Empty',
    message: 'No events scheduled for this period. Your appointments will appear on the calendar.',
  },
  error: {
    title: 'Oops! Something went wrong',
    message: 'We encountered an error while loading your data. Please try again or contact support.',
  },
  'no-results': {
    title: 'No Results Found',
    message: 'We could not find any matches for your search. Try adjusting your search terms.',
  },
};

export const EmptyState = ({ type, title, message, action }: EmptyStateProps) => {
  const defaultContent = defaultMessages[type];
  const displayTitle = title || defaultContent.title;
  const displayMessage = message || defaultContent.message;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-48 h-48 mb-6">
        <EmptyStateIllustration type={type} />
      </div>
      
      <h3 className="text-xl font-semibold text-text-primary mb-2">
        {displayTitle}
      </h3>
      
      <p className="text-text-secondary max-w-md mb-6">
        {displayMessage}
      </p>
      
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          <Icon name="PlusIcon" size={20} />
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
