'use client';

import Icon from '@/components/ui/AppIcon';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
  showInfo?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  showInfo = true,
}: PaginationProps) {
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const startItem = totalItems ? (currentPage - 1) * (itemsPerPage || 10) + 1 : null;
  const endItem = totalItems ? Math.min(currentPage * (itemsPerPage || 10), totalItems) : null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
      {showInfo && totalItems && (
        <div className="text-sm text-text-secondary">
          Showing <span className="font-medium text-text-primary">{startItem}</span> to{' '}
          <span className="font-medium text-text-primary">{endItem}</span> of{' '}
          <span className="font-medium text-text-primary">{totalItems}</span> results
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* Previous button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1 px-3 py-2 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Icon name="ChevronLeftIcon" size={16} />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => (
            <button
              key={index}
              onClick={() => typeof page === 'number' && onPageChange(page)}
              disabled={page === '...'}
              className={`
                min-w-[40px] h-10 px-3 rounded-lg font-medium transition-colors
                ${
                  page === currentPage
                    ? 'bg-primary text-primary-foreground'
                    : page === '...'
                      ? 'cursor-default text-text-secondary'
                      : 'text-text-secondary hover:text-text-primary hover:bg-muted'
                }
              `}
            >
              {page}
            </button>
          ))}
        </div>

        {/* Next button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1 px-3 py-2 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span className="hidden sm:inline">Next</span>
          <Icon name="ChevronRightIcon" size={16} />
        </button>
      </div>
    </div>
  );
}

// Items per page selector
interface ItemsPerPageProps {
  value: number;
  onChange: (value: number) => void;
  options?: number[];
}

export function ItemsPerPage({ value, onChange, options = [10, 20, 50, 100] }: ItemsPerPageProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-text-secondary">Show</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="px-3 py-2 rounded-lg border border-border bg-card text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <span className="text-text-secondary">per page</span>
    </div>
  );
}

export default Pagination;
