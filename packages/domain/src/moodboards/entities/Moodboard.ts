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
  imageId: string;
  enhancementType: string;
  prompt: string;
  cost: number;
  timestamp: Date;
}

export class Moodboard {
  constructor(private props: MoodboardProps) {}

  static create(data: Omit<MoodboardProps, 'id' | 'createdAt' | 'updatedAt'>): Moodboard {
    return new Moodboard({
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
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
  }

  removeItem(itemId: string): void {
    const itemIndex = this.props.items.findIndex(item => item.id === itemId);
    if (itemIndex !== -1) {
      const item = this.props.items[itemIndex];
      this.props.items.splice(itemIndex, 1);
      this.decreaseSourceBreakdown(item);
      this.props.updatedAt = new Date();
    }
  }

  logEnhancement(entry: EnhancementLogEntry): void {
    this.props.enhancementLog.push(entry);
    this.props.totalCost += entry.cost;
    this.props.updatedAt = new Date();
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

