# Mention System

A reusable @ mention system for referencing items with auto-complete and thumbnails.

## Components

### `MentionInput`
A textarea component with @ mention functionality.

```tsx
import { MentionInput } from '@/components/ui/mention-input';
import { MentionableItem } from '../../../hooks/useMentionSystem';

const mentionableItems: MentionableItem[] = [
  {
    id: '1',
    label: 'Character',
    thumbnail: '/path/to/image.jpg',
    type: 'Character',
    metadata: { originalType: 'character' }
  }
];

<MentionInput
  value={prompt}
  onChange={setPrompt}
  placeholder="Type @ to mention items..."
  mentionableItems={mentionableItems}
  onMentionSelect={(item) => console.log('Selected:', item)}
  rows={4}
/>
```

### `useMentionSystem` Hook
Core logic for handling mentions.

```tsx
import { useMentionSystem } from '../../../hooks/useMentionSystem';

const {
  activeMatch,
  suggestions,
  selectedIndex,
  handleTextChange,
  handleMentionSelect,
  handleKeyDown,
  isActive,
} = useMentionSystem({
  items: mentionableItems,
  onMentionSelect: (item) => console.log('Mentioned:', item),
});
```

## Features

- **Auto-complete**: Type `@` followed by text to see suggestions
- **Thumbnails**: Visual preview of mentionable items
- **Keyboard Navigation**: Arrow keys, Enter, Tab, Escape
- **Type Filtering**: Filter by item type or label
- **Customizable**: Configurable trigger character and max suggestions

## Usage in Stitch Tab

The mention system is integrated into the Stitch prompt field, allowing users to reference their source images:

- Type `@Character` to reference a character image
- Type `@shoes` to reference a custom labeled image
- See thumbnails and types in the dropdown
- View referenced images below the prompt field

## Reusability

This system can be used anywhere in the playground where you need to reference items:

- **Prompt fields**: Reference images, styles, or other assets
- **Description fields**: Mention related content
- **Tag systems**: Reference predefined tags or categories
- **Project references**: Link to other projects or templates

## API

### MentionableItem
```tsx
interface MentionableItem {
  id: string;
  label: string;
  thumbnail?: string;
  type?: string;
  metadata?: Record<string, any>;
}
```

### MentionInput Props
```tsx
interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  mentionableItems: MentionableItem[];
  onMentionSelect?: (item: MentionableItem) => void;
  disabled?: boolean;
  rows?: number;
}
```
