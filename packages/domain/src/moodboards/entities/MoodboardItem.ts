export interface MoodboardItemProps {
  id: string;
  source: 'pexels' | 'user-upload' | 'ai-enhanced' | 'ai-generated';
  url: string;
  thumbnailUrl?: string;
  attribution?: string;
  width?: number;
  height?: number;
  palette?: string[];
  blurhash?: string;
  enhancementPrompt?: string;
  originalImageId?: string;
  position: number;
}

export class MoodboardItem {
  constructor(private props: MoodboardItemProps) {}

  static create(data: Omit<MoodboardItemProps, 'id'>): MoodboardItem {
    return new MoodboardItem({
      ...data,
      id: crypto.randomUUID()
    });
  }

  get id(): string { return this.props.id; }
  get source(): string { return this.props.source; }
  get url(): string { return this.props.url; }
  get attribution(): string | undefined { return this.props.attribution; }
  get position(): number { return this.props.position; }
  get width(): number | undefined { return this.props.width; }
  get height(): number | undefined { return this.props.height; }
  get palette(): string[] | undefined { return this.props.palette; }

  updatePosition(newPosition: number): void {
    this.props.position = newPosition;
  }

  updatePalette(palette: string[]): void {
    this.props.palette = palette;
  }

  toJSON(): MoodboardItemProps {
    return { ...this.props };
  }
}

