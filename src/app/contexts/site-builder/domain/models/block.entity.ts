/**
 * @fileoverview `Block` entity: a single content section of a landing page.
 *
 * A block is the unit that both editing modes operate on:
 *
 * - The **code editor** reads and replaces the block's structured payload
 *   ({@link Block.data} and {@link Block.styles}) as JSON.
 * - The **visual editor** mutates the same payload through intention-revealing
 *   methods such as {@link Block.addImage} / {@link Block.removeImage}.
 *
 * Because both modes share one payload, a gallery authored in code can be
 * edited visually and vice versa — there is a single source of truth.
 */

import { EntityBase } from '../../../../shared/core/domain/entity.base';
import { Result } from '../../../../shared/core/result/result';
import { BlockId } from '../value-objects/block-id.vo';
import { BlockType } from '../value-objects/block-type.vo';
import { BlockImage } from '../value-objects/block-image.vo';

/**
 * Arbitrary structured content for a block. The exact keys depend on the
 * {@link BlockType} (e.g. a HERO has `title`/`subtitle`, a gallery has
 * `images`). Kept open so new block types need no entity changes.
 */
export type BlockData = Record<string, unknown>;

/**
 * Inline style overrides for a block (background, text color, spacing…).
 */
export type BlockStyles = Record<string, string>;

/**
 * The mutable properties held by a {@link Block}.
 */
export interface BlockProps {
  /** The block kind, which dictates the shape of `data`. */
  type: BlockType;
  /** Zero-based position of the block within the page. */
  order: number;
  /** Structured content payload. */
  data: BlockData;
  /** Inline style overrides. */
  styles: BlockStyles;
}

/**
 * Domain entity representing one landing-page section.
 */
export class Block extends EntityBase<BlockProps, string> {
  /**
   * @param id - The block identifier.
   * @param props - The block's properties.
   */
  private constructor(
    private readonly blockId: BlockId,
    props: BlockProps,
  ) {
    super(blockId.value, props);
  }

  /**
   * Creates a new {@link Block} with a freshly generated temporary id.
   * Used by the visual editor when adding a section.
   *
   * @param type - The block type.
   * @param order - The position of the block in the page.
   * @param data - Initial structured content. Defaults to an empty object.
   * @param styles - Initial style overrides. Defaults to an empty object.
   * @returns A successful result with the new block.
   */
  public static createNew(
    type: BlockType,
    order: number,
    data: BlockData = {},
    styles: BlockStyles = {},
  ): Result<Block> {
    return Result.ok(
      new Block(BlockId.generate(), { type, order, data, styles }),
    );
  }

  /**
   * Rehydrates a {@link Block} from persisted/primitive data, validating
   * the id and type along the way.
   *
   * @param params - The raw block fields, typically from the API mapper.
   * @returns A successful result, or a failure if id/type are invalid.
   */
  public static fromPrimitives(params: {
    id: string;
    type: string;
    order: number;
    data: BlockData;
    styles: BlockStyles;
  }): Result<Block> {
    const idResult = BlockId.create(params.id);
    if (idResult.isFailure) {
      return Result.fail<Block>(idResult.error);
    }

    const typeResult = BlockType.create(params.type);
    if (typeResult.isFailure) {
      return Result.fail<Block>(typeResult.error);
    }

    return Result.ok(
      new Block(idResult.value, {
        type: typeResult.value,
        order: params.order,
        data: params.data ?? {},
        styles: params.styles ?? {},
      }),
    );
  }

  /** The block type value object. */
  public get type(): BlockType {
    return this.props.type;
  }

  /** The block's position within the page. */
  public get order(): number {
    return this.props.order;
  }

  /** The block's structured content payload (read-only copy). */
  public get data(): BlockData {
    return { ...this.props.data };
  }

  /** The block's inline style overrides (read-only copy). */
  public get styles(): BlockStyles {
    return { ...this.props.styles };
  }

  /** Whether this block still has a temporary, unsaved id. */
  public get isNew(): boolean {
    return this.blockId.isTemporary();
  }

  /**
   * Moves the block to a new position within the page.
   *
   * @param newOrder - The new zero-based position. Must be non-negative.
   * @returns A successful result, or a failure for a negative order.
   */
  public moveTo(newOrder: number): Result<void> {
    if (newOrder < 0) {
      return Result.fail<void>('Block order cannot be negative.');
    }
    this.props.order = newOrder;
    return Result.ok<void>(undefined);
  }

  /**
   * Replaces the entire content payload. This is the operation the **code
   * editor** performs after parsing the JSON the user typed.
   *
   * @param data - The new structured content.
   * @param styles - The new style overrides. Defaults to the current styles.
   * @returns A successful result.
   */
  public replaceContent(data: BlockData, styles?: BlockStyles): Result<void> {
    this.props.data = { ...data };
    if (styles) {
      this.props.styles = { ...styles };
    }
    return Result.ok<void>(undefined);
  }

  /**
   * Sets a single field inside the content payload. This is what the
   * **visual editor** calls when the user edits one input (e.g. the hero
   * title), without disturbing the rest of the payload.
   *
   * @param key - The field name within `data`.
   * @param value - The new value for that field.
   * @returns A successful result.
   */
  public setField(key: string, value: unknown): Result<void> {
    this.props.data = { ...this.props.data, [key]: value };
    return Result.ok<void>(undefined);
  }

  /**
   * Returns the images held by this block, parsed from the `data.images`
   * array. Empty when the block holds no images or is not image-bearing.
   *
   * @returns The list of valid {@link BlockImage} instances.
   */
  public getImages(): BlockImage[] {
    const raw = this.props.data['images'];
    if (!Array.isArray(raw)) {
      return [];
    }
    return raw
      .map((item) => BlockImage.create(item as never))
      .filter((result): result is Result<BlockImage> => result.isSuccess)
      .map((result) => result.value);
  }

  /**
   * Adds an image to an image-bearing block. Rejected for block types that
   * do not support images, so the visual editor never produces invalid data.
   *
   * @param image - The image to append.
   * @returns A successful result, or a failure for unsupported block types.
   */
  public addImage(image: BlockImage): Result<void> {
    if (!this.props.type.supportsImages()) {
      return Result.fail<void>(
        `Block type "${this.props.type.value}" does not support images.`,
      );
    }
    const images = this.getImages().map((img) => img.props);
    images.push(image.props);
    this.props.data = { ...this.props.data, images };
    return Result.ok<void>(undefined);
  }

  /**
   * Removes an image by id from an image-bearing block.
   *
   * @param imageId - The id of the image to remove.
   * @returns A successful result, or a failure when the image is not found.
   */
  public removeImage(imageId: string): Result<void> {
    if (!this.props.type.supportsImages()) {
      return Result.fail<void>(
        `Block type "${this.props.type.value}" does not support images.`,
      );
    }
    const images = this.getImages().map((img) => img.props);
    const next = images.filter((img) => img.id !== imageId);
    if (next.length === images.length) {
      return Result.fail<void>(`Image "${imageId}" was not found in this block.`);
    }
    this.props.data = { ...this.props.data, images: next };
    return Result.ok<void>(undefined);
  }

  /**
   * Serializes the block to a primitive object for transport or for the
   * code editor to display as JSON.
   *
   * @returns A plain, serializable representation of the block.
   */
  public toPrimitives(): {
    id: string;
    type: string;
    order: number;
    data: BlockData;
    styles: BlockStyles;
  } {
    return {
      id: this.blockId.value,
      type: this.props.type.value,
      order: this.props.order,
      data: this.data,
      styles: this.styles,
    };
  }
}
