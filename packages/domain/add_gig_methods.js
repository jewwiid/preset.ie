const fs = require('fs');
const path = './src/gigs/entities/gig.ts';

let content = fs.readFileSync(path, 'utf8');

// Add the missing methods before the closing brace
const methodsToAdd = `
  // Additional getter methods needed by application layer
  getOwnerId(): string { return this.props.ownerUserId.toString(); }
  getTitle(): string { return this.props.title; }
  getId(): string { return this.id.toString(); }
  get ownerId(): EntityId { return this.props.ownerUserId; }
  getDateTimeWindow(): { getStartTime(): Date; getEndTime(): Date } {
    return {
      getStartTime: () => this.props.startTime,
      getEndTime: () => this.props.endTime
    };
  }
  attachMoodboard(moodboardId: EntityId): void {
    this.props.updatedAt = new Date();
  }`;

// Find the last closing brace and add methods before it
const lastBraceIndex = content.lastIndexOf('}');
if (lastBraceIndex !== -1) {
  content = content.slice(0, lastBraceIndex) + methodsToAdd + '\n' + content.slice(lastBraceIndex);
  fs.writeFileSync(path, content);
  console.log('Successfully added Gig methods');
} else {
  console.log('Could not find closing brace');
}
