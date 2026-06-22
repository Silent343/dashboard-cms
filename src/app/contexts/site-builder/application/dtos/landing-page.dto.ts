/**
 * @fileoverview Data Transfer Objects describing the JSON contract exchanged
 * with the backend REST API. These mirror the wire format exactly and carry
 * no behavior — domain models are built from them by the mapper.
 */

/**
 * Wire representation of a single block.
 */
export interface BlockDto {
  /** Block identifier (server-assigned for persisted blocks). */
  id: string;
  /** Block type literal, e.g. `"HERO"`. */
  type: string;
  /** Zero-based order within the page. */
  order: number;
  /** Structured content payload. */
  data: Record<string, unknown>;
  /** Inline style overrides. */
  styles: Record<string, string>;
}

/**
 * Wire representation of a landing page returned by `GET /sites/{slug}`.
 */
export interface LandingPageDto {
  /** Page identifier. */
  id: string;
  /** Unique slug. */
  slug: string;
  /** Human-friendly title. */
  title: string;
  /** Ordered blocks. */
  blocks: BlockDto[];
}
