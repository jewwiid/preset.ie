import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Gig } from '../types';
import { GigCard } from './GigCard';

interface GigGridProps {
  gigs: Gig[];
  savedGigs: Set<string>;
  onToggleSave: (gigId: string) => void;
  gigsPerPage?: number;
}

/**
 * Grid layout component with pagination
 * Displays gigs in a responsive grid with page navigation
 */
export const GigGrid = ({ gigs, savedGigs, onToggleSave, gigsPerPage = 12 }: GigGridProps) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate pagination
  const indexOfLastGig = currentPage * gigsPerPage;
  const indexOfFirstGig = indexOfLastGig - gigsPerPage;
  const currentGigs = gigs.slice(indexOfFirstGig, indexOfLastGig);
  const totalPages = Math.ceil(gigs.length / gigsPerPage);

  return (
    <>
      {/* Gig Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentGigs.map((gig) => (
          <GigCard
            key={gig.id}
            gig={gig}
            isSaved={savedGigs.has(gig.id)}
            onToggleSave={onToggleSave}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          {[...Array(totalPages)].map((_, index) => (
            <Button
              key={index + 1}
              variant={currentPage === index + 1 ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(index + 1)}
            >
              {index + 1}
            </Button>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </>
  );
};
