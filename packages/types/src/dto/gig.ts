import { GigStatus, CompensationType } from '../database/enums';
import { PublicProfileDTO } from './user';

export interface GigDTO {
  id: string;
  owner: PublicProfileDTO;
  title: string;
  description: string;
  purpose?: string;
  compType: CompensationType;
  location: LocationDTO;
  schedule: ScheduleDTO;
  applications: ApplicationInfoDTO;
  usageRights?: string;
  safetyNotes?: string;
  status: GigStatus;
  boostLevel: number;
  moodboard?: MoodboardDTO;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface LocationDTO {
  text: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  radiusM?: number;
}

export interface ScheduleDTO {
  startTime: Date;
  endTime?: Date;
  applicationDeadline: Date;
  isFlexible?: boolean;
}

export interface ApplicationInfoDTO {
  maxApplicants?: number;
  currentApplicants: number;
  isOpen: boolean;
  userHasApplied?: boolean;
  userApplicationId?: string;
}

export interface MoodboardDTO {
  id: string;
  title?: string;
  summary?: string;
  palette?: string[];
  items: MoodboardItemDTO[];
  aiTags?: string[];
}

export interface MoodboardItemDTO {
  id: string;
  url: string;
  thumbnailUrl?: string;
  order: number;
  caption?: string;
  blurhash?: string;
  width?: number;
  height?: number;
}

export interface GigListItemDTO {
  id: string;
  owner: {
    id: string;
    displayName: string;
    handle: string;
    avatarUrl?: string;
  };
  title: string;
  compType: CompensationType;
  locationText: string;
  startTime: Date;
  applicationDeadline: Date;
  currentApplicants: number;
  maxApplicants?: number;
  status: GigStatus;
  boostLevel: number;
  coverImage?: string;
  tags?: string[];
}

export interface GigCreateDTO {
  title: string;
  description: string;
  purpose?: string;
  compType: CompensationType;
  locationText: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  radiusM?: number;
  startTime: Date;
  endTime?: Date;
  applicationDeadline: Date;
  maxApplicants?: number;
  usageRights?: string;
  safetyNotes?: string;
}

export interface GigUpdateDTO extends Partial<GigCreateDTO> {
  status?: GigStatus;
  boostLevel?: number;
}

export interface GigStatsDTO {
  views: number;
  saves: number;
  applications: number;
  conversionRate: number;
  averageResponseTime?: number;
}