import { Camera } from 'lucide-react';

interface EmptyStateProps {
  hasFilters: boolean;
  onClearFilters?: () => void;
}

/**
 * Empty state component shown when no gigs are found
 * Shows different messages based on whether filters are active
 */
export const EmptyState = ({ hasFilters, onClearFilters }: EmptyStateProps) => {
  return (
    <div className="text-center py-12">
      <Camera className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-medium text-muted-foreground-900 mb-2">No gigs found</h3>
      {hasFilters ? (
        <>
          <p className="text-muted-foreground mb-4">Try adjusting your filters or search terms</p>
          {onClearFilters && (
            <button
              onClick={onClearFilters}
              className="text-primary hover:underline font-medium"
            >
              Clear all filters
            </button>
          )}
        </>
      ) : (
        <p className="text-muted-foreground">Check back soon for new opportunities</p>
      )}
    </div>
  );
};
