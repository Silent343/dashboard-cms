/**
 * @fileoverview Base class for all Entities in the domain.
 *
 * Unlike value objects, an Entity has a stable identity. Two entities are
 * equal when they share the same identifier, regardless of whether their
 * other attributes differ.
 */

/**
 * Abstract base for domain Entities.
 *
 * Identity equality is based on the entity's `id`. Subclasses hold their
 * mutable state in `props` and expose intention-revealing methods to
 * change it, never public setters.
 *
 * @typeParam TProps - The shape of the entity's properties.
 * @typeParam TId - The type of the entity's identifier. Defaults to `string`.
 */
export abstract class EntityBase<TProps, TId = string> {
  /**
   * The stable identity of this entity.
   */
  protected readonly _id: TId;

  /**
   * The entity's mutable properties. Mutated only through domain methods.
   */
  protected props: TProps;

  /**
   * @param id - The entity identifier.
   * @param props - The entity's initial properties.
   */
  protected constructor(id: TId, props: TProps) {
    this._id = id;
    this.props = props;
  }

  /**
   * The entity identifier.
   */
  public get id(): TId {
    return this._id;
  }

  /**
   * Identity equality. Two entities are equal when they are the same class
   * and share the same id.
   *
   * @param other - The entity to compare against.
   * @returns `true` when both share the same identity, otherwise `false`.
   */
  public equals(other?: EntityBase<TProps, TId>): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    if (this === other) {
      return true;
    }
    return this._id === other._id;
  }
}
