export class EntityId {
  constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('EntityId cannot be empty');
    }
  }

  equals(other: EntityId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  static generate(): EntityId {
    return new EntityId(crypto.randomUUID());
  }

  static from(value: string): EntityId {
    return new EntityId(value);
  }
}