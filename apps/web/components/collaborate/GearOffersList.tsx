'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Package,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  ExternalLink,
  MessageCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { getAuthToken } from '../../lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface GearOffer {
  id: string;
  offer_type: 'rent' | 'borrow' | 'sell';
  daily_rate_cents?: number;
  total_price_cents?: number;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  created_at: string;
  rejection_reason?: string;
  offerer: {
    id: string;
    handle?: string;
    display_name: string;
    avatar_url?: string;
    verified_id?: boolean;
    city?: string;
    country?: string;
  };
  gear_request?: {
    id: string;
    category: string;
    equipment_spec?: string;
    quantity: number;
  };
  listing?: {
    id: string;
    title: string;
    description?: string;
    category: string;
    rent_day_cents?: number;
    sale_price_cents?: number;
  };
}

interface GearOffersListProps {
  projectId: string;
  offers: GearOffer[];
  isCreator: boolean;
  onOfferUpdate?: () => void;
}

export function GearOffersList({ projectId, offers, isCreator, onOfferUpdate }: GearOffersListProps) {
  const [actioningOfferId, setActioningOfferId] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingOffer, setRejectingOffer] = useState<GearOffer | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleAccept = async (offerId: string) => {
    setActioningOfferId(offerId);
    try {
      const token = await getAuthToken();
      const response = await fetch(`/api/collab/projects/${projectId}/gear-offers/${offerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ status: 'accepted' })
      });

      if (response.ok) {
        toast.success('Offer accepted!');
        onOfferUpdate?.();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to accept offer');
      }
    } catch (err) {
      console.error('Error accepting offer:', err);
      toast.error('Failed to accept offer');
    } finally {
      setActioningOfferId(null);
    }
  };

  const openRejectDialog = (offer: GearOffer) => {
    setRejectingOffer(offer);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!rejectingOffer) return;

    setActioningOfferId(rejectingOffer.id);
    try {
      const token = await getAuthToken();
      const response = await fetch(`/api/collab/projects/${projectId}/gear-offers/${rejectingOffer.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          status: 'rejected',
          rejection_reason: rejectionReason || undefined
        })
      });

      if (response.ok) {
        toast.success('Offer rejected');
        onOfferUpdate?.();
        setRejectDialogOpen(false);
        setRejectingOffer(null);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to reject offer');
      }
    } catch (err) {
      console.error('Error rejecting offer:', err);
      toast.error('Failed to reject offer');
    } finally {
      setActioningOfferId(null);
    }
  };

  const handleWithdraw = async (offerId: string) => {
    setActioningOfferId(offerId);
    try {
      const token = await getAuthToken();
      const response = await fetch(`/api/collab/projects/${projectId}/gear-offers/${offerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ status: 'withdrawn' })
      });

      if (response.ok) {
        toast.success('Offer withdrawn');
        onOfferUpdate?.();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to withdraw offer');
      }
    } catch (err) {
      console.error('Error withdrawing offer:', err);
      toast.error('Failed to withdraw offer');
    } finally {
      setActioningOfferId(null);
    }
  };

  const formatPrice = (cents: number) => `€${(cents / 100).toFixed(2)}`;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'accepted':
        return <Badge variant="default" className="bg-primary-500"><CheckCircle className="h-3 w-3 mr-1" />Accepted</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'withdrawn':
        return <Badge variant="outline"><XCircle className="h-3 w-3 mr-1" />Withdrawn</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Group offers by gear request
  const offersByRequest = offers.reduce((acc, offer) => {
    const requestId = offer.gear_request?.id || 'general';
    if (!acc[requestId]) {
      acc[requestId] = {
        request: offer.gear_request,
        offers: []
      };
    }
    acc[requestId].offers.push(offer);
    return acc;
  }, {} as Record<string, { request?: GearOffer['gear_request']; offers: GearOffer[] }>);

  if (offers.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Package className="h-12 w-12 text-muted-foreground-400 mx-auto mb-4" />
          <p className="text-muted-foreground-500">No equipment offers yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {Object.entries(offersByRequest).map(([requestId, { request, offers: groupOffers }]) => (
          <div key={requestId} className="space-y-3">
            {request && (
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-primary-600" />
                <h3 className="font-medium text-lg">
                  {request.category}
                  {request.equipment_spec && ` - ${request.equipment_spec}`}
                </h3>
                <Badge variant="outline">{groupOffers.length} offer{groupOffers.length !== 1 ? 's' : ''}</Badge>
              </div>
            )}

            {groupOffers.map((offer) => (
              <Card key={offer.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={offer.offerer.avatar_url} />
                        <AvatarFallback>
                          {offer.offerer.display_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{offer.offerer.display_name}</span>
                          {offer.offerer.verified_id && (
                            <Badge variant="secondary" className="text-xs">Verified</Badge>
                          )}
                        </div>
                        {offer.offerer.handle && (
                          <p className="text-sm text-muted-foreground">@{offer.offerer.handle}</p>
                        )}
                        {(offer.offerer.city || offer.offerer.country) && (
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <MapPin className="h-3 w-3 mr-1" />
                            {[offer.offerer.city, offer.offerer.country].filter(Boolean).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                    {getStatusBadge(offer.status)}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Listing Info */}
                  {offer.listing && (
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{offer.listing.title}</h4>
                          {offer.listing.description && (
                            <p className="text-sm text-muted-foreground mt-1">{offer.listing.description}</p>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <a href={`/gear/listings/${offer.listing.id}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Offer Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Offer Type:</span>
                      <p className="font-medium capitalize">{offer.offer_type}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Price:</span>
                      <p className="font-medium text-primary-600">
                        {offer.offer_type === 'sell'
                          ? formatPrice(offer.total_price_cents!)
                          : `${formatPrice(offer.daily_rate_cents!)}/day`}
                      </p>
                    </div>
                  </div>

                  {/* Message */}
                  {offer.message && (
                    <div>
                      <span className="text-sm text-muted-foreground">Message:</span>
                      <p className="text-sm mt-1">{offer.message}</p>
                    </div>
                  )}

                  {/* Rejection Reason */}
                  {offer.status === 'rejected' && offer.rejection_reason && (
                    <div className="p-3 bg-destructive-50 border border-destructive-200 rounded-lg">
                      <span className="text-sm font-medium text-destructive-600">Rejection Reason:</span>
                      <p className="text-sm text-destructive-600 mt-1">{offer.rejection_reason}</p>
                    </div>
                  )}

                  {/* Timestamp */}
                  <p className="text-xs text-muted-foreground">
                    Submitted {formatDate(offer.created_at)}
                  </p>

                  {/* Actions */}
                  {offer.status === 'pending' && (
                    <div className="flex space-x-2 pt-2 border-t border-border-200">
                      {isCreator ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleAccept(offer.id)}
                            disabled={actioningOfferId === offer.id}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openRejectDialog(offer)}
                            disabled={actioningOfferId === offer.id}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            asChild
                          >
                            <a href={`/messages?user=${offer.offerer.id}`}>
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Message
                            </a>
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleWithdraw(offer.id)}
                          disabled={actioningOfferId === offer.id}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Withdraw
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ))}
      </div>

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Offer</DialogTitle>
            <DialogDescription>
              Optionally provide a reason for rejecting this offer
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">Reason (Optional)</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Let the offerer know why you're rejecting their offer..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={actioningOfferId === rejectingOffer?.id}
            >
              {actioningOfferId === rejectingOffer?.id ? 'Rejecting...' : 'Reject Offer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
