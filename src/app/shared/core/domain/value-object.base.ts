/**
 * @fileoverview Base class for all Value Objects in the domain.
 *
 * A Value Object has no identity: two value objects are equal when their
 * properties are equal, not when they are the same instance. They are also
 * immutable once created.
 */

/**
 * Marker type for the properties that compose a value object. Each concrete
 * value object declares its own props shape.
 */
export type ValueObjectProps = Record<string, unknown>;

/**
 * Abstract base for Value Objects.
 *
 * Provides structural equality and immutability. Subclasses should keep
 * their constructor private and expose a static factory (commonly
 * `create`) that validates input and returns a `Result`.
 *
 * @typeParam TProps - The shape of the wrapped properties.
 */
export abstract class ValueObjectBase<TProps extends ValueObjectProps> {
  /**
   * The immutable properties backing this value object.
   */
  protected readonly props: TProps;

  /**
   * @param props - The properties to wrap. They are frozen to enforce
   *   immutability.
   */
  protected constructor(props: TProps) {
    this.props = Object.freeze({ ...props });
  }

  /**
   * Structural equality. Two value objects are equal when their wrapped
   * properties are deeply equal.
   *
   * @param other - The value object to compare against.
   * @returns `true` when both wrap equal properties, otherwise `false`.
   */
  public equals(other?: ValueObjectBase<TProps>): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    if (other.props === undefined) {
      return false;
    }
    return JSON.stringify(this.props) === JSON.stringify(other.props);
  }
}
