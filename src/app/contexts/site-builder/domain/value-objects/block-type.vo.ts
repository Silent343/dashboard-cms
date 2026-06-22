/**
 * @fileoverview `BlockType` value object: the enumerated kind of a content
 * block on a landing page. The type determines which fields live in the
 * block's `data` payload and how both the code editor and the visual
 * editor render it.
 */

import { Result } from '../../../../shared/core/result/result';

/**
 * The set of supported block types.
 *
 * - `HERO` — top banner with title, subtitle and a call to action.
 * - `TEXT` — a rich text / paragraph block.
 * - `IMAGE_GALLERY` — an ordered collection of images.
 * - `FEATURES` — a grid of feature items (icon, title, description).
 * - `CTA` — a standalone call-to-action band.
 * - `CONTACT` — contact details and/or a WhatsApp action.
 * - `CUSTOM_HTML` — raw HTML escape hatch for fully custom sections.
 */
export const BLOCK_TYPES = [
  'HERO',
  'TEXT',
  'IMAGE_GALLERY',
  'FEATURES',
  'CTA',
  'CONTACT',
  'CUSTOM_HTML',
] as const;

/**
 * Union of the literal block-type strings, derived from {@link BLOCK_TYPES}.
 */
export type BlockTypeValue = (typeof BLOCK_TYPES)[number];

/**
 * Value object wrapping a validated block type.
 *
 * Guarantees that only a known {@link BlockTypeValue} can ever flow through
 * the domain, so downstream code can switch over the type exhaustively.
 */
export class BlockType {
  /**
   * @param value - The validated block-type literal.
   */
  private constructor(public readonly value: BlockTypeValue) {}

  /**
   * Creates a {@link BlockType} from an arbitrary string, validating it
   * against {@link BLOCK_TYPES}.
   *
   * @param raw - The candidate block-type string.
   * @returns A successful result with the value object, or a failure when
   *   the string is not a supported block type.
   */
  public static create(raw: string): Result<BlockType> {
    const normalized = raw?.trim().toUpperCase();
    if (!BLOCK_TYPES.includes(normalized as BlockTypeValue)) {
      return Result.fail<BlockType>(
        `Unsupported block type: "${raw}". Allowed: ${BLOCK_TYPES.join(', ')}.`,
      );
    }
    return Result.ok(new BlockType(normalized as BlockTypeValue));
  }

  /**
   * Whether this block type can hold images that the visual editor may add
   * or remove. Used to decide if the "add / remove image" controls appear.
   *
   * @returns `true` for image-bearing blocks.
   */
  public supportsImages(): boolean {
    return this.value === 'IMAGE_GALLERY' || this.value === 'HERO';
  }

  /**
   * Structural equality on the wrapped literal.
   *
   * @param other - The block type to compare against.
   * @returns `true` when both wrap the same literal.
   */
  public equals(other?: BlockType): boolean {
    return !!other && other.value === this.value;
  }
}
