'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { CalendarIcon, Euro } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface RentalRequestFormProps {
  listing: {
    id: string;
    title: string;
    rent_day_cents?: number;
    rent_week_cents?: number;
    deposit_cents: number;
    retainer_cents: number;
    owner_id: string;
    quantity: number;
  };
  onClose: () => void;
  onSuccess?: () => void;
  initialMessage?: string;
}

export default function RentalRequestForm({ listing, onClose, onSuccess, initialMessage }: RentalRequestFormProps) {
  const [loading, setLoading] = useState(false);
  const [hasExistingRequest, setHasExistingRequest] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    quantity: 1,
    message: initialMessage || '',
    total_amount_cents: 0,
    includeAsPublicComment: false
  });

  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  // Check for existing requests on component mount
  React.useEffect(() => {
    checkExistingRequest();
  }, []);

  const checkExistingRequest = async () => {
    try {
      const { supabase } = await import('@/lib/supabase');
      if (!supabase) {
        setCheckingExisting(false);
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        setCheckingExisting(false);
        return;
      }

      const response = await fetch('/api/marketplace/my-rental-requests', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const existingRequest = data.rental_requests?.find(
          (req: any) => req.listing_id === listing.id && req.status === 'pending'
        );
        setHasExistingRequest(!!existingRequest);
      }
    } catch (error) {
      console.error('Error checking existing request:', error);
    } finally {
      setCheckingExisting(false);
    }
  };

  const calculateTotal = () => {
    if (!startDate || !endDate) return 0;
    
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const quantity = listing.quantity > 1 ? formData.quantity : 1;
    
    // Handle optional rental pricing
    if (!listing.rent_day_cents) {
      toast.error('This listing does not have rental pricing configured');
      return 0;
    }
    
    const dailyCost = listing.rent_day_cents * quantity;
    const totalRental = dailyCost * days;
    const deposit = listing.deposit_cents * quantity;
    const retainer = listing.retainer_cents * quantity;
    
    return totalRental + deposit + retainer;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startDate || !endDate) {
      toast.error('Please select start and end dates');
      return;
    }

    if (startDate >= endDate) {
      toast.error('End date must be after start date');
      return;
    }

    if (formData.quantity < 1) {
      toast.error('Quantity must be at least 1');
      return;
    }

    if (formData.quantity > listing.quantity) {
      toast.error(`Cannot request more than ${listing.quantity} item${listing.quantity !== 1 ? 's' : ''} (available quantity)`);
      return;
    }

    setLoading(true);
    try {
        // Get the current session
        const { supabase } = await import('@/lib/supabase');
        if (!supabase) {
          toast.error('Failed to initialize database connection');
          setLoading(false);
          return;
        }
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session?.access_token) {
          toast.error('Please sign in to send rental requests');
          setLoading(false);
          return;
        }

        const requestData = {
          listing_id: listing.id,
          owner_id: listing.owner_id,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          quantity: listing.quantity > 1 ? formData.quantity : 1,
          message: formData.message,
          total_amount_cents: calculateTotal()
        };

        console.log('Sending rental request with data:', requestData);

        const response = await fetch('/api/marketplace/rental-requests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify(requestData)
        });

        const responseData = await response.json();
        console.log('Rental request response:', { status: response.status, data: responseData });

        if (response.ok) {
          toast.success('Rental request sent successfully!');
          
          // If user wants to also post as public comment, do that now
          if (formData.includeAsPublicComment && formData.message.trim()) {
            try {
              const commentResponse = await fetch(`/api/marketplace/listings/${listing.id}/comments`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                  comment_body: formData.message.trim()
                })
              });
              
              if (commentResponse.ok) {
                toast.success('Question also posted publicly!');
              } else {
                console.warn('Failed to post public comment:', await commentResponse.text());
              }
            } catch (commentError) {
              console.warn('Error posting public comment:', commentError);
            }
          }
          
          onSuccess?.();
          onClose();
        } else {
          toast.error(responseData.error || 'Failed to send rental request');
        }
    } catch (error) {
      console.error('Error sending rental request:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = calculateTotal();

  if (checkingExisting) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Request Rental</h3>
          <p className="text-sm text-muted-foreground">
            Checking for existing requests...
          </p>
        </div>
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="md" />
        </div>
      </div>
    );
  }

  if (hasExistingRequest) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Request Already Sent</h3>
          <p className="text-sm text-muted-foreground">
            You already have a pending rental request for this listing
          </p>
        </div>
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="text-sm font-medium">Pending Request</span>
          </div>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
            You can view and manage your request in the "My Requests" section.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Close
          </Button>
          <Button onClick={() => window.open('/gear/my-requests', '_blank')} className="flex-1">
            View My Requests
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      <div className="space-y-3 sm:space-y-4">
        {listing.quantity > 1 && (
          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Select
              value={formData.quantity.toString()}
              onValueChange={(value) => setFormData(prev => ({ ...prev, quantity: parseInt(value) }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select quantity" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: listing.quantity }, (_, i) => i + 1).map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} item{num !== 1 ? 's' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-1">
              Available: {listing.quantity} item{listing.quantity !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <Label>Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal mt-1",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <span className="truncate">
                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label>End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal mt-1",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <span className="truncate">
                    {endDate ? format(endDate, "PPP") : "Pick a date"}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                  disabled={(date) => date < new Date() || (startDate ? date <= startDate : false)}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div>
          <Label htmlFor="message">Message (Optional)</Label>
          <Textarea
            id="message"
            placeholder="Add any special requests or questions..."
            value={formData.message}
            onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
            className="mt-1"
            rows={3}
          />
          {formData.message && (
            <div className="mt-2 flex items-center space-x-2">
              <Checkbox
                id="includeAsPublicComment"
                checked={formData.includeAsPublicComment}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, includeAsPublicComment: !!checked }))}
              />
              <Label htmlFor="includeAsPublicComment" className="text-sm text-muted-foreground">
                Also post this as a public question on the listing
              </Label>
            </div>
          )}
        </div>
      </div>

      {/* Cost Breakdown */}
      {startDate && endDate && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-3">
            {(() => {
              const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
              const quantity = listing.quantity > 1 ? formData.quantity : 1;
              
              // Handle optional rental pricing
              if (!listing.rent_day_cents) {
                return (
                  <div className="text-center text-muted-foreground py-4">
                    This listing does not have rental pricing configured
                  </div>
                );
              }
              
              const dailyCost = listing.rent_day_cents * quantity;
              const totalRental = dailyCost * days;
              const deposit = listing.deposit_cents * quantity;
              const retainer = listing.retainer_cents * quantity;

              return (
                <>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-sm sm:text-base break-words">
                      Rental ({days} days × {listing.quantity > 1 ? formData.quantity : 1} item{listing.quantity > 1 && formData.quantity > 1 ? 's' : ''})
                    </span>
                    <span className="text-sm sm:text-base font-medium whitespace-nowrap">€{(totalRental / 100).toFixed(2)}</span>
                  </div>
                  {deposit > 0 && (
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-sm sm:text-base">Deposit</span>
                      <span className="text-sm sm:text-base font-medium whitespace-nowrap">€{(deposit / 100).toFixed(2)}</span>
                    </div>
                  )}
                  {retainer > 0 && (
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-sm sm:text-base">Retainer</span>
                      <span className="text-sm sm:text-base font-medium whitespace-nowrap">€{(retainer / 100).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center gap-2 font-semibold border-t pt-2 mt-2">
                    <span className="text-sm sm:text-base">Total</span>
                    <span className="text-base sm:text-lg font-bold whitespace-nowrap">€{(totalAmount / 100).toFixed(2)}</span>
                  </div>
                </>
              );
            })()}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:space-x-0">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1 order-2 sm:order-1">
          Cancel
        </Button>
        <Button type="submit" disabled={loading || !startDate || !endDate} className="flex-1 order-1 sm:order-2">
          {loading ? 'Sending...' : 'Send Request'}
        </Button>
      </div>
    </form>
  );
}
