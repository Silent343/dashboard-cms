/**
 * @fileoverview `Slug` value object: the unique, URL-safe identifier under
 * which a landing page is served by the backend (e.g. `/sites/{slug}`).
 */

import { Result } from '../../../../shared/core/result/result';

/**
 * Value object wrapping a validated URL slug.
 *
 * A slug is lowercase, may contain letters, digits and hyphens, must start
 * and end with an alphanumeric character, and is between 3 and 40 chars.
 */
export class Slug {
  private static readonly PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/;

  /**
   * @param value - The validated slug string.
   */
  private constructor(public readonly value: string) {}

  /**
   * Creates a {@link Slug}, validating format and length.
   *
   * @param raw - The candidate slug string.
   * @returns A successful result, or a failure describing the violation.
   */
  public static create(raw: string): Result<Slug> {
    const normalized = raw?.trim().toLowerCase() ?? '';
    if (normalized.length < 3 || normalized.length > 40) {
      return Result.fail<Slug>('Slug must be between 3 and 40 characters.');
    }
    if (!Slug.PATTERN.test(normalized)) {
      return Result.fail<Slug>(
        'Slug may only contain lowercase letters, digits and hyphens, ' +
          'and must start and end with a letter or digit.',
      );
    }
    return Result.ok(new Slug(normalized));
  }

  /**
   * Structural equality on the wrapped string.
   *
   * @param other - The slug to compare against.
   * @returns `true` when both wrap the same value.
   */
  public equals(other?: Slug): boolean {
    return !!other && other.value === this.value;
  }
}
