import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { MapPin, Calendar, Users, Heart, Clock, Camera, ArrowLeft, Share2, Copy, Bookmark, ExternalLink } from 'lucide-react';
import { Gig } from '../types';
import { getCompTypeIcon, getCompTypeColor, formatDate, getDaysUntilDeadline, getLookingForLabel } from '../utils';

interface GigCardProps {
  gig: Gig;
  isSaved: boolean;
  onToggleSave: (gigId: string) => void;
}

/**
 * Individual gig card component
 * Displays gig information in a card format with save functionality
 */
export const GigCard = ({ gig, isSaved, onToggleSave }: GigCardProps) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Link href={`/gigs/${gig.id}`}>
          <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer border-border hover:border-primary/50">
        {/* Gig Image/Moodboard Preview */}
        <div className="relative bg-muted overflow-hidden">
          <div className="h-48 bg-muted">
            {gig.moodboard_urls && gig.moodboard_urls.length > 0 ? (
              <div className="relative w-full h-full">
                {gig.moodboard_urls.length === 1 ? (
                  /* Single image - full space */
                  <img
                    src={gig.moodboard_urls[0]}
                    alt={gig.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : gig.moodboard_urls.length === 2 ? (
                  /* Two images - side by side */
                  <div className="flex h-full">
                    <img
                      src={gig.moodboard_urls[0]}
                      alt={`${gig.title} image 1`}
                      className="w-1/2 h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <img
                      src={gig.moodboard_urls[1]}
                      alt={`${gig.title} image 2`}
                      className="w-1/2 h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : gig.moodboard_urls.length === 3 ? (
                  /* Three images - 2 on top, 1 on bottom */
                  <div className="grid grid-cols-2 h-full">
                    <img
                      src={gig.moodboard_urls[0]}
                      alt={`${gig.title} image 1`}
                      className="h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <img
                      src={gig.moodboard_urls[1]}
                      alt={`${gig.title} image 2`}
                      className="h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <img
                      src={gig.moodboard_urls[2]}
                      alt={`${gig.title} image 3`}
                      className="col-span-2 h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  /* Four or more images - 2x2 grid */
                  <div className="grid grid-cols-2 h-full">
                    <img
                      src={gig.moodboard_urls[0]}
                      alt={`${gig.title} image 1`}
                      className="h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <img
                      src={gig.moodboard_urls[1]}
                      alt={`${gig.title} image 2`}
                      className="h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <img
                      src={gig.moodboard_urls[2]}
                      alt={`${gig.title} image 3`}
                      className="h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {gig.moodboard_urls.length === 3 ? (
                      <div className="h-full bg-muted flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">+0</span>
                      </div>
                    ) : (
                      <div className="relative h-full">
                        <img
                          src={gig.moodboard_urls[3]}
                          alt={`${gig.title} image 4`}
                          className="h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {gig.moodboard_urls.length > 4 && (
                          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                            <span className="text-sm font-semibold text-foreground">
                              +{gig.moodboard_urls.length - 4}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Image count indicator */}
                <div className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm">
                  <span className="text-xs font-medium text-foreground">
                    {gig.moodboard_urls.length} image{gig.moodboard_urls.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/20">
                <Camera className="w-16 h-16 text-primary/40" />
              </div>
            )}
          </div>

          {/* Save Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              onToggleSave(gig.id);
            }}
            className="absolute top-3 right-3 p-2 bg-background/90 backdrop-blur-sm rounded-full shadow-md hover:shadow-lg hover:bg-background transition-all z-10"
          >
            <Heart
              className={`w-5 h-5 ${isSaved ? 'fill-primary text-primary' : 'text-muted-foreground hover:text-primary'}`}
            />
          </button>

          {/* Compensation Badge */}
          <div className={`absolute top-3 left-3 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 backdrop-blur-sm shadow-sm ${getCompTypeColor(gig.comp_type)}`}>
            {getCompTypeIcon(gig.comp_type)}
            <span>{gig.comp_type}</span>
          </div>
        </div>

        {/* Gig Details */}
        <CardContent className="p-5 space-y-4">
          {/* Title */}
          <div>
            <h3 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors line-clamp-2">
              {gig.title}
            </h3>

            {/* Looking For Role Badges */}
            {gig.looking_for_types && gig.looking_for_types.length > 0 && (
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground font-medium">Looking for:</span>
                {gig.looking_for_types.slice(0, 2).map((type) => (
                  <Badge
                    key={type}
                    variant="secondary"
                    className="text-xs font-medium"
                  >
                    👤 {getLookingForLabel(type)}
                  </Badge>
                ))}
                {gig.looking_for_types.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{gig.looking_for_types.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Creator Info - Simplified */}
          <div className="flex items-center gap-3">
            <HoverCard>
              <HoverCardTrigger asChild>
                <Avatar className="w-12 h-12 ring-2 ring-primary/10 cursor-pointer">
                  <AvatarImage
                    src={gig.users_profile?.avatar_url || undefined}
                    alt={gig.users_profile?.display_name || 'User'}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {gig.users_profile?.display_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}
                  </AvatarFallback>
                </Avatar>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">{gig.users_profile?.display_name || 'User'}</h4>
                  <p className="text-sm text-muted-foreground">@{gig.users_profile?.handle || 'user'}</p>
                </div>
              </HoverCardContent>
            </HoverCard>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {gig.users_profile?.display_name || 'Unknown User'}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {gig.users_profile?.years_experience && (
                  <span>{gig.users_profile.years_experience} years exp</span>
                )}
                {gig.users_profile?.hourly_rate_min && gig.users_profile?.hourly_rate_max && (
                  <>
                    <span>•</span>
                    <span>${gig.users_profile.hourly_rate_min}-${gig.users_profile.hourly_rate_max}/hr</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Location and Date */}
          <Separator />
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{gig.location_text}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span>{formatDate(gig.start_time)}</span>
            </div>
          </div>

          {/* Purpose and Style Tags - Compact */}
          {(gig.purpose || (gig.style_tags && gig.style_tags.length > 0)) && (
            <>
              <Separator />
              <div className="flex flex-wrap gap-1.5">
                {gig.purpose && (
                  <Badge variant="outline" className="text-xs">
                    {gig.purpose.replace('_', ' ')}
                  </Badge>
                )}
                {gig.style_tags && gig.style_tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {gig.style_tags && gig.style_tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{gig.style_tags.length - 3}
                  </Badge>
                )}
              </div>
            </>
          )}

          {/* Color Palette Preview - Compact */}
          {gig.palette_colors && gig.palette_colors.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {gig.palette_colors.slice(0, 5).map((color, index) => (
                  <div
                    key={index}
                    className="w-5 h-5 rounded-full border-2 border-background shadow-sm"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              {gig.palette_colors.length > 5 && (
                <span className="text-xs text-muted-foreground">+{gig.palette_colors.length - 5}</span>
              )}
            </div>
          )}

          {/* Footer Stats */}
          <Separator />
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                <span className="font-medium">{gig.current_applicants}/{gig.max_applicants}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span className="font-medium">{getDaysUntilDeadline(gig.application_deadline)}d left</span>
              </div>
            </div>
            <span className="text-primary font-semibold group-hover:gap-2 flex items-center gap-1 transition-all">
              View
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
      </ContextMenuTrigger>
      <ContextMenuContent className="bg-popover border-border">
        <ContextMenuItem onClick={() => window.open(`/gigs/${gig.id}`, '_blank')}>
          <ExternalLink className="w-4 h-4 mr-2" />
          View Details
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onToggleSave(gig.id)}>
          <Bookmark className="w-4 h-4 mr-2" />
          {isSaved ? 'Remove from Saved' : 'Save Gig'}
        </ContextMenuItem>
        <ContextMenuItem onClick={() => {
          if (navigator.share) {
            navigator.share({
              title: gig.title,
              text: gig.description,
              url: `${window.location.origin}/gigs/${gig.id}`
            })
          } else {
            navigator.clipboard.writeText(`${window.location.origin}/gigs/${gig.id}`)
          }
        }}>
          <Share2 className="w-4 h-4 mr-2" />
          Share Gig
        </ContextMenuItem>
        <ContextMenuItem onClick={() => {
          navigator.clipboard.writeText(`${window.location.origin}/gigs/${gig.id}`)
        }}>
          <Copy className="w-4 h-4 mr-2" />
          Copy Link
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
