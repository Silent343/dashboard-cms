/**
 * @fileoverview Functional `Result` type used across the domain and
 * application layers to model success and failure without throwing
 * exceptions. This keeps business logic pure and makes error paths
 * explicit in method signatures.
 */

/**
 * Represents the outcome of an operation that can either succeed with a
 * value of type `T` or fail with an error of type `E`.
 *
 * Using `Result` instead of throwing exceptions makes failure a
 * first-class, type-checked part of every signature, which is a core
 * tenet of a clean domain layer.
 *
 * @typeParam T - The type of the value produced on success.
 * @typeParam E - The type of the error produced on failure. Defaults to `string`.
 *
 * @example
 * ```ts
 * const result = Slug.create('my-page');
 * if (result.isFailure) {
 *   console.error(result.error);
 * } else {
 *   useSlug(result.value);
 * }
 * ```
 */
export class Result<T, E = string> {
  /** Whether the operation succeeded. */
  public readonly isSuccess: boolean;

  /** Whether the operation failed. Always the negation of {@link isSuccess}. */
  public readonly isFailure: boolean;

  private readonly _value?: T;
  private readonly _error?: E;

  /**
   * Private constructor. Use {@link Result.ok} or {@link Result.fail}
   * to build instances so invariants are always enforced.
   *
   * @param isSuccess - Whether this represents a success.
   * @param value - The success value, present only when `isSuccess` is true.
   * @param error - The error, present only when `isSuccess` is false.
   * @throws {Error} If a successful result carries an error, or a failed
   *   result carries no error.
   */
  private constructor(isSuccess: boolean, value?: T, error?: E) {
    if (isSuccess && error !== undefined) {
      throw new Error('A successful Result cannot contain an error.');
    }
    if (!isSuccess && error === undefined) {
      throw new Error('A failed Result must contain an error.');
    }

    this.isSuccess = isSuccess;
    this.isFailure = !isSuccess;
    this._value = value;
    this._error = error;

    Object.freeze(this);
  }

  /**
   * Builds a successful result wrapping the given value.
   *
   * @typeParam U - The success value type.
   * @typeParam F - The error type of the resulting `Result`.
   * @param value - The value to wrap.
   * @returns A successful {@link Result}.
   */
  public static ok<U, F = string>(value: U): Result<U, F> {
    return new Result<U, F>(true, value, undefined);
  }

  /**
   * Builds a failed result wrapping the given error.
   *
   * @typeParam U - The success value type of the resulting `Result`.
   * @typeParam F - The error type.
   * @param error - The error to wrap.
   * @returns A failed {@link Result}.
   */
  public static fail<U, F = string>(error: F): Result<U, F> {
    return new Result<U, F>(false, undefined, error);
  }

  /**
   * Returns the success value.
   *
   * @returns The wrapped value.
   * @throws {Error} If called on a failed result.
   */
  public get value(): T {
    if (!this.isSuccess || this._value === undefined) {
      throw new Error('Cannot read the value of a failed Result.');
    }
    return this._value;
  }

  /**
   * Returns the error.
   *
   * @returns The wrapped error.
   * @throws {Error} If called on a successful result.
   */
  public get error(): E {
    if (this.isSuccess || this._error === undefined) {
      throw new Error('Cannot read the error of a successful Result.');
    }
    return this._error;
  }

  /**
   * Combines several results into one. The combined result fails with the
   * first error encountered, or succeeds (with no value) if all succeed.
   *
   * Useful for validating multiple value objects at once before building
   * an entity.
   *
   * @param results - The results to combine.
   * @returns A successful `Result<void>` if all succeed, otherwise the
   *   first failure.
   */
  public static combine(results: ReadonlyArray<Result<unknown, unknown>>): Result<void> {
    for (const result of results) {
      if (result.isFailure) {
        return Result.fail<void>(String(result.error));
      }
    }
    return Result.ok<void>(undefined);
  }
}
