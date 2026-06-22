/**
 * @fileoverview Mapper translating between {@link LandingPageDto} wire data
 * and the {@link LandingPage} domain aggregate. Keeping mapping isolated
 * here means the domain never depends on the transport shape.
 */

import { Result } from '../../../../shared/core/result/result';
import { Block } from '../../domain/models/block.entity';
import { LandingPage } from '../../domain/models/landing-page.aggregate';
import { BlockDto, LandingPageDto } from '../dtos/landing-page.dto';

/**
 * Static mapper for landing-page DTOs.
 */
export class LandingPageMapper {
  /**
   * Builds a {@link LandingPage} aggregate from its DTO, rehydrating every
   * block. Fails fast if any block or the page itself is invalid.
   *
   * @param dto - The wire DTO from the API.
   * @returns A result with the aggregate, or the first validation failure.
   */
  public static toDomain(dto: LandingPageDto): Result<LandingPage> {
    const blocks: Block[] = [];
    for (const blockDto of dto.blocks ?? []) {
      const blockResult = Block.fromPrimitives(blockDto);
      if (blockResult.isFailure) {
        return Result.fail<LandingPage>(blockResult.error);
      }
      blocks.push(blockResult.value);
    }

    return LandingPage.fromPrimitives({
      id: dto.id,
      slug: dto.slug,
      title: dto.title,
      blocks,
    });
  }

  /**
   * Serializes a {@link LandingPage} aggregate back to its DTO for sending
   * to the API (e.g. on `PUT /sites/{slug}`).
   *
   * @param page - The domain aggregate.
   * @returns The wire DTO.
   */
  public static toDto(page: LandingPage): LandingPageDto {
    const primitives = page.toPrimitives();
    return {
      id: primitives.id,
      slug: primitives.slug,
      title: primitives.title,
      blocks: primitives.blocks as BlockDto[],
    };
  }
}
