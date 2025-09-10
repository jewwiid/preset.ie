import { ShowcaseStatus } from '../database/enums';
import { PublicProfileDTO } from './user';
import { GigListItemDTO } from './gig';

export interface ShowcaseDTO {
  id: string;
  gig: GigListItemDTO;
  creator: PublicProfileDTO;
  talent: PublicProfileDTO;
  media: ShowcaseMediaDTO[];
  caption?: string;
  tags?: string[];
  palette?: string[];
  status: ShowcaseStatus;
  visibility: 'public' | 'private';
  approvals: ApprovalStatusDTO;
  releaseForm?: ReleaseFormDTO;
  createdAt: Date;
  publishedAt?: Date;
}

export interface ShowcaseMediaDTO {
  id: string;
  url: string;
  thumbnailUrl?: string;
  type: 'image' | 'video';
  width?: number;
  height?: number;
  duration?: number;
  blurhash?: string;
  caption?: string;
  order: number;
}

export interface ApprovalStatusDTO {
  creator: {
    approved: boolean;
    approvedAt?: Date;
  };
  talent: {
    approved: boolean;
    approvedAt?: Date;
  };
}

export interface ReleaseFormDTO {
  id: string;
  url: string;
  signedAt: Date;
  usageRights: string;
  duration: string;
  territory: string;
}

export interface ShowcaseListItemDTO {
  id: string;
  gigTitle: string;
  creator: {
    id: string;
    displayName: string;
    handle: string;
  };
  talent: {
    id: string;
    displayName: string;
    handle: string;
  };
  coverImage: string;
  mediaCount: number;
  tags?: string[];
  status: ShowcaseStatus;
  visibility: string;
  createdAt: Date;
}

export interface ShowcaseCreateDTO {
  gigId: string;
  mediaIds: string[];
  caption?: string;
  tags?: string[];
}

export interface ShowcaseUpdateDTO {
  caption?: string;
  tags?: string[];
  visibility?: 'public' | 'private';
}