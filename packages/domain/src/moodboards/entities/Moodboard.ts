import { BaseAggregateRoot } from '../../shared/BaseAggregateRoot';
import { MoodboardCreated, MoodboardItemAdded, ImageEnhanced } from '../events/MoodboardEvents';
import { MoodboardItem } from './MoodboardItem';

export interface MoodboardProps {
  id: string;
  gigId: string;
  ownerId: string;
  title: string;
  summary?: string;
  items: MoodboardItem[];
  palette: string[];
  sourceBreakdown: SourceBreakdown;
  enhancementLog: EnhancementLogEntry[];
  totalCost: number;
  generatedPrompts: string[];
  aiProvider?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SourceBreakdown {
  pexels: number;
  userUploads: number;
  aiEnhanced: number;
  aiGenerated: number;
}

export interface EnhancementLogEntry {
  originalUrl: string;
  enhancedUrl: string;
  enhancementType: string;
  taskId: string;
  cost: number;
  timestamp: Date;
}

export class Moodboard extends BaseAggregateRoot {
  constructor(private props: MoodboardProps) {
    super();
  }

  static create(data: Omit<MoodboardProps, 'id' | 'createdAt' | 'updatedAt'>): Moodboard {
    const moodboard = new Moodboard({
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Emit domain event
    moodboard.raise(new MoodboardCreated(
      moodboard.id,
      {
        gigId: data.gigId,
        ownerId: data.ownerId,
        title: data.title,
        itemCount: data.items.length
      }
    ));
    
    return moodboard;
  }

  get id(): string { return this.props.id; }
  get gigId(): string { return this.props.gigId; }
  get ownerId(): string { return this.props.ownerId; }
  get title(): string { return this.props.title; }
  get items(): MoodboardItem[] { return this.props.items; }
  get totalCost(): number { return this.props.totalCost; }
  get sourceBreakdown(): SourceBreakdown { return this.props.sourceBreakdown; }

  addItem(item: MoodboardItem): void {
    this.props.items.push(item);
    this.updateSourceBreakdown(item);
    this.props.updatedAt = new Date();
    
    // Emit domain event
    this.raise(new MoodboardItemAdded(
      this.id,
      {
        moodboardId: this.id,
        itemId: item.id,
        itemType: item.source,
        source: item.source
      }
    ));
  }

  removeItem(itemId: string): void {
    const itemIndex = this.props.items.findIndex(item => item.id === itemId);
    if (itemIndex !== -1) {
      const item = this.props.items[itemIndex];
      this.props.items.splice(itemIndex, 1);
      if (item) {
        this.decreaseSourceBreakdown(item);
      }
      this.props.updatedAt = new Date();
    }
  }

  addEnhancement(entry: EnhancementLogEntry): void {
    this.props.enhancementLog.push(entry);
    this.props.totalCost += entry.cost;
    this.props.sourceBreakdown.aiEnhanced++;
    this.props.updatedAt = new Date();
    
    // Emit domain event
    this.raise(new ImageEnhanced(
      this.id,
      {
        moodboardId: this.id,
        originalUrl: entry.originalUrl,
        enhancedUrl: entry.enhancedUrl,
        enhancementType: entry.enhancementType,
        cost: entry.cost
      }
    ));
  }
  
  logEnhancement(entry: EnhancementLogEntry): void {
    this.addEnhancement(entry);
  }

  updatePalette(palette: string[]): void {
    this.props.palette = palette;
    this.props.updatedAt = new Date();
  }

  private updateSourceBreakdown(item: MoodboardItem): void {
    switch (item.source) {
      case 'pexels':
        this.props.sourceBreakdown.pexels++;
        break;
      case 'user-upload':
        this.props.sourceBreakdown.userUploads++;
        break;
      case 'ai-enhanced':
        this.props.sourceBreakdown.aiEnhanced++;
        break;
      case 'ai-generated':
        this.props.sourceBreakdown.aiGenerated++;
        break;
    }
  }

  private decreaseSourceBreakdown(item: MoodboardItem): void {
    switch (item.source) {
      case 'pexels':
        this.props.sourceBreakdown.pexels--;
        break;
      case 'user-upload':
        this.props.sourceBreakdown.userUploads--;
        break;
      case 'ai-enhanced':
        this.props.sourceBreakdown.aiEnhanced--;
        break;
      case 'ai-generated':
        this.props.sourceBreakdown.aiGenerated--;
        break;
    }
  }

  toJSON(): MoodboardProps {
    return { ...this.props };
  }
}

export { MoodboardItem } from './MoodboardItem';

