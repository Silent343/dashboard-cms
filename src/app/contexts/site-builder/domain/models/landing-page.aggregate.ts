/**
 * @fileoverview `LandingPage` aggregate root: the consistency boundary that
 * owns an ordered list of {@link Block} entities plus the page's slug.
 *
 * All structural changes to a page (add, remove, reorder blocks) go through
 * this aggregate so block ordering and uniqueness invariants stay valid.
 */

import { EntityBase } from '../../../../shared/core/domain/entity.base';
import { Result } from '../../../../shared/core/result/result';
import { Slug } from '../value-objects/slug.vo';
import { Block } from './block.entity';

/**
 * The mutable properties of a {@link LandingPage}.
 */
export interface LandingPageProps {
  /** The unique slug under which the page is served. */
  slug: Slug;
  /** Human-friendly page title shown in the dashboard. */
  title: string;
  /** The ordered blocks that compose the page. */
  blocks: Block[];
}

/**
 * Aggregate root for a single landing page.
 */
export class LandingPage extends EntityBase<LandingPageProps, string> {
  /**
   * @param id - The page identifier.
   * @param props - The page's properties.
   */
  private constructor(id: string, props: LandingPageProps) {
    super(id, props);
  }

  /**
   * Rehydrates a {@link LandingPage} from primitive fields, typically from
   * the API mapper. Blocks are sorted by their `order` to guarantee a
   * consistent in-memory sequence.
   *
   * @param params - The raw page fields.
   * @returns A successful result, or a failure when the slug is invalid.
   */
  public static fromPrimitives(params: {
    id: string;
    slug: string;
    title: string;
    blocks: Block[];
  }): Result<LandingPage> {
    const slugResult = Slug.create(params.slug);
    if (slugResult.isFailure) {
      return Result.fail<LandingPage>(slugResult.error);
    }

    const sorted = [...params.blocks].sort((a, b) => a.order - b.order);
    return Result.ok(
      new LandingPage(params.id, {
        slug: slugResult.value,
        title: params.title ?? 'Untitled page',
        blocks: sorted,
      }),
    );
  }

  /** The page slug. */
  public get slug(): Slug {
    return this.props.slug;
  }

  /** The page title. */
  public get title(): string {
    return this.props.title;
  }

  /**
   * The page blocks in display order. Returns a copy so callers cannot
   * mutate the internal array directly.
   */
  public get blocks(): readonly Block[] {
    return [...this.props.blocks];
  }

  /**
   * Adds a block at the end of the page, assigning it the next order.
   *
   * @param block - The block to append. Its order is overwritten.
   * @returns A successful result.
   */
  public addBlock(block: Block): Result<void> {
    block.moveTo(this.props.blocks.length);
    this.props.blocks.push(block);
    return Result.ok<void>(undefined);
  }

  /**
   * Removes a block by id and re-numbers the remaining blocks so their
   * orders stay contiguous (0..n-1).
   *
   * @param blockId - The id of the block to remove.
   * @returns A successful result, or a failure when the block is not found.
   */
  public removeBlock(blockId: string): Result<void> {
    const index = this.props.blocks.findIndex((b) => b.id === blockId);
    if (index === -1) {
      return Result.fail<void>(`Block "${blockId}" was not found.`);
    }
    this.props.blocks.splice(index, 1);
    this.reindex();
    return Result.ok<void>(undefined);
  }

  /**
   * Reorders a block from one position to another and re-numbers all blocks
   * to keep orders contiguous.
   *
   * @param fromIndex - The current position of the block.
   * @param toIndex - The desired position.
   * @returns A successful result, or a failure for out-of-range indices.
   */
  public reorderBlock(fromIndex: number, toIndex: number): Result<void> {
    const count = this.props.blocks.length;
    if (fromIndex < 0 || fromIndex >= count || toIndex < 0 || toIndex >= count) {
      return Result.fail<void>('Reorder indices are out of range.');
    }
    const [moved] = this.props.blocks.splice(fromIndex, 1);
    this.props.blocks.splice(toIndex, 0, moved);
    this.reindex();
    return Result.ok<void>(undefined);
  }

  /**
   * Finds a block by id.
   *
   * @param blockId - The id to look up.
   * @returns The block, or `undefined` when not present.
   */
  public findBlock(blockId: string): Block | undefined {
    return this.props.blocks.find((b) => b.id === blockId);
  }

  /**
   * Serializes the whole page to primitives for transport.
   *
   * @returns A plain, serializable representation of the page.
   */
  public toPrimitives(): {
    id: string;
    slug: string;
    title: string;
    blocks: ReturnType<Block['toPrimitives']>[];
  } {
    return {
      id: this._id,
      slug: this.props.slug.value,
      title: this.props.title,
      blocks: this.props.blocks.map((b) => b.toPrimitives()),
    };
  }

  /**
   * Re-numbers blocks so their `order` values are contiguous and match
   * their array position. Called after any structural mutation.
   */
  private reindex(): void {
    this.props.blocks.forEach((block, index) => block.moveTo(index));
  }
}
