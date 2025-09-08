import { EntityId } from './value-objects/entity-id';

export abstract class Entity<T> {
  protected readonly _id: EntityId;

  constructor(id: EntityId) {
    this._id = id;
  }

  get id(): EntityId {
    return this._id;
  }

  equals(entity: Entity<T>): boolean {
    return this._id.equals(entity._id);
  }
}