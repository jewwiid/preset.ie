import { Entity } from '../../shared/entity';
import { EntityId } from '../../shared/value-objects/entity-id';

export interface ShowcaseProps {
  gigId: EntityId;
  creatorUserId: EntityId;
  talentUserId: EntityId;
  mediaIds: EntityId[];
  caption?: string;
  tags: string[];
  palette: string[];
  approvedByCreatorAt?: Date;
  approvedByTalentAt?: Date;
  visibility: ShowcaseVisibility;
  createdAt: Date;
  updatedAt: Date;
}

export enum ShowcaseVisibility {
  DRAFT = 'DRAFT',
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE'
}

export class Showcase extends Entity<ShowcaseProps> {
  private props: ShowcaseProps;

  constructor(id: EntityId, props: ShowcaseProps) {
    super(id);
    this.props = props;
    this.validateMediaCount();
  }

  private validateMediaCount(): void {
    if (this.props.mediaIds.length < 3 || this.props.mediaIds.length > 6) {
      throw new Error('Showcase must contain between 3 and 6 media items');
    }
  }

  static create(
    gigId: EntityId,
    creatorUserId: EntityId,
    talentUserId: EntityId,
    mediaIds: EntityId[],
    caption?: string,
    tags: string[] = [],
    palette: string[] = []
  ): Showcase {
    const id = EntityId.generate();
    const now = new Date();

    return new Showcase(id, {
      gigId,
      creatorUserId,
      talentUserId,
      mediaIds,
      caption,
      tags,
      palette,
      visibility: ShowcaseVisibility.DRAFT,
      createdAt: now,
      updatedAt: now
    });
  }

  approveByCreator(): void {
    if (this.props.approvedByCreatorAt) {
      throw new Error('Creator has already approved this showcase');
    }
    
    this.props.approvedByCreatorAt = new Date();
    this.props.updatedAt = new Date();
    
    this.checkAndPublish();
  }

  approveByTalent(): void {
    if (this.props.approvedByTalentAt) {
      throw new Error('Talent has already approved this showcase');
    }
    
    this.props.approvedByTalentAt = new Date();
    this.props.updatedAt = new Date();
    
    this.checkAndPublish();
  }

  private checkAndPublish(): void {
    if (this.props.approvedByCreatorAt && this.props.approvedByTalentAt) {
      this.props.visibility = ShowcaseVisibility.PUBLIC;
    }
  }

  updateMedia(mediaIds: EntityId[]): void {
    this.props.mediaIds = mediaIds;
    this.validateMediaCount();
    this.props.updatedAt = new Date();
  }

  updateCaption(caption: string): void {
    this.props.caption = caption;
    this.props.updatedAt = new Date();
  }

  updateTags(tags: string[]): void {
    this.props.tags = tags;
    this.props.updatedAt = new Date();
  }

  makePrivate(): void {
    this.props.visibility = ShowcaseVisibility.PRIVATE;
    this.props.updatedAt = new Date();
  }

  isPublished(): boolean {
    return this.props.visibility === ShowcaseVisibility.PUBLIC;
  }

  isFullyApproved(): boolean {
    return Boolean(this.props.approvedByCreatorAt && this.props.approvedByTalentAt);
  }

  get gigId(): EntityId { return this.props.gigId; }
  get creatorUserId(): EntityId { return this.props.creatorUserId; }
  get talentUserId(): EntityId { return this.props.talentUserId; }
  get mediaIds(): EntityId[] { return this.props.mediaIds; }
  get caption(): string | undefined { return this.props.caption; }
  get tags(): string[] { return this.props.tags; }
  get palette(): string[] { return this.props.palette; }
  get approvedByCreatorAt(): Date | undefined { return this.props.approvedByCreatorAt; }
  get approvedByTalentAt(): Date | undefined { return this.props.approvedByTalentAt; }
  get visibility(): ShowcaseVisibility { return this.props.visibility; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
}