/**
 * Approval for showcase publication
 */
export class Approval {
  constructor(
    private readonly userId: string,
    private readonly approvedAt: Date,
    private readonly note?: string
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.userId) {
      throw new Error('User ID is required for approval');
    }

    if (!this.approvedAt) {
      throw new Error('Approval date is required');
    }

    if (this.approvedAt > new Date()) {
      throw new Error('Approval date cannot be in the future');
    }

    if (this.note && this.note.length > 500) {
      throw new Error('Approval note cannot exceed 500 characters');
    }
  }

  getUserId(): string {
    return this.userId;
  }

  getApprovedAt(): Date {
    return new Date(this.approvedAt);
  }

  getNote(): string | undefined {
    return this.note;
  }

  /**
   * Check if approval was given within a time window
   */
  isWithinHours(hours: number): boolean {
    const hoursAgo = new Date();
    hoursAgo.setHours(hoursAgo.getHours() - hours);
    return this.approvedAt >= hoursAgo;
  }

  toJSON() {
    return {
      userId: this.userId,
      approvedAt: this.approvedAt.toISOString(),
      note: this.note
    };
  }

  equals(other: Approval): boolean {
    return this.userId === other.userId &&
           this.approvedAt.getTime() === other.approvedAt.getTime();
  }
}