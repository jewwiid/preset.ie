/**
 * Value object representing a time window for a gig
 */
export class DateTimeWindow {
  constructor(
    private readonly startTime: Date,
    private readonly endTime: Date
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.startTime || !this.endTime) {
      throw new Error('Start and end times are required');
    }

    if (this.startTime >= this.endTime) {
      throw new Error('End time must be after start time');
    }

    const now = new Date();
    if (this.startTime < now) {
      throw new Error('Start time cannot be in the past');
    }

    // Maximum window is 7 days
    const maxDuration = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    const duration = this.endTime.getTime() - this.startTime.getTime();
    if (duration > maxDuration) {
      throw new Error('Time window cannot exceed 7 days');
    }

    // Minimum window is 30 minutes
    const minDuration = 30 * 60 * 1000; // 30 minutes in milliseconds
    if (duration < minDuration) {
      throw new Error('Time window must be at least 30 minutes');
    }
  }

  getStartTime(): Date {
    return new Date(this.startTime);
  }

  getEndTime(): Date {
    return new Date(this.endTime);
  }

  /**
   * Get duration in milliseconds
   */
  getDuration(): number {
    return this.endTime.getTime() - this.startTime.getTime();
  }

  /**
   * Get duration in hours
   */
  getDurationHours(): number {
    return this.getDuration() / (60 * 60 * 1000);
  }

  /**
   * Check if a date falls within this window
   */
  contains(date: Date): boolean {
    return date >= this.startTime && date <= this.endTime;
  }

  /**
   * Check if this window overlaps with another
   */
  overlaps(other: DateTimeWindow): boolean {
    return this.startTime < other.endTime && this.endTime > other.startTime;
  }

  /**
   * Check if the window is in the future
   */
  isFuture(): boolean {
    return this.startTime > new Date();
  }

  /**
   * Check if the window is currently active
   */
  isActive(): boolean {
    const now = new Date();
    return now >= this.startTime && now <= this.endTime;
  }

  /**
   * Check if the window has passed
   */
  isPast(): boolean {
    return this.endTime < new Date();
  }

  /**
   * Get a formatted string representation
   */
  format(): string {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };

    const start = this.startTime.toLocaleDateString('en-US', options);
    const end = this.endTime.toLocaleDateString('en-US', options);

    // If same day, show simplified format
    if (this.startTime.toDateString() === this.endTime.toDateString()) {
      const endTime = this.endTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
      return `${start} - ${endTime}`;
    }

    return `${start} - ${end}`;
  }

  toJSON() {
    return {
      startTime: this.startTime.toISOString(),
      endTime: this.endTime.toISOString()
    };
  }

  equals(other: DateTimeWindow): boolean {
    return this.startTime.getTime() === other.startTime.getTime() &&
           this.endTime.getTime() === other.endTime.getTime();
  }
}