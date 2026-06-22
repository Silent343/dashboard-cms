/**
 * @fileoverview `BlockImage` value object: a single image entry inside an
 * image-bearing block (e.g. a gallery). Holds the data needed to render
 * and manage the image from both editing modes.
 */

import { Result } from '../../../../shared/core/result/result';

/**
 * The serializable shape of a block image, as stored in the block's `data`
 * payload and exchanged with the API.
 */
export interface BlockImageProps {
  /** Stable identifier of the image (assigned by the media context). */
  readonly id: string;
  /** Public URL where the image is served. */
  readonly url: string;
  /** Alternative text for accessibility and SEO. */
  readonly alt: string;
}

/**
 * Value object representing one image within a block.
 *
 * Immutable: editing an image produces a new instance. This is what lets a
 * gallery authored in the code editor be safely manipulated in the visual
 * editor — both operate on the same image list.
 */
export class BlockImage {
  /**
   * @param props - The validated image properties.
   */
  private constructor(public readonly props: BlockImageProps) {
    Object.freeze(this.props);
  }

  /**
   * Creates a {@link BlockImage}, validating that the URL is present.
   *
   * @param props - The candidate image properties.
   * @returns A successful result, or a failure when the URL is missing.
   */
  public static create(props: BlockImageProps): Result<BlockImage> {
    if (!props.url || props.url.trim().length === 0) {
      return Result.fail<BlockImage>('Image URL is required.');
    }
    if (!props.id || props.id.trim().length === 0) {
      return Result.fail<BlockImage>('Image id is required.');
    }
    return Result.ok(
      new BlockImage({
        id: props.id.trim(),
        url: props.url.trim(),
        alt: props.alt?.trim() ?? '',
      }),
    );
  }

  /** The image identifier. */
  public get id(): string {
    return this.props.id;
  }

  /** The image URL. */
  public get url(): string {
    return this.props.url;
  }

  /** The image alt text. */
  public get alt(): string {
    return this.props.alt;
  }
}
