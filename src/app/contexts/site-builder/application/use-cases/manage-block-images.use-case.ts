/**
 * @fileoverview Use case: add or remove images on a block from the visual
 * editor. This is the operation that lets a gallery authored in code be
 * edited without code — it mutates the same `data.images` list.
 */

import { Injectable } from '@angular/core';
import { Result } from '../../../../shared/core/result/result';
import { LandingPage } from '../../domain/models/landing-page.aggregate';
import { BlockImage } from '../../domain/value-objects/block-image.vo';

/**
 * Adds and removes images on image-bearing blocks.
 */
@Injectable({ providedIn: 'root' })
export class ManageBlockImagesUseCase {
  /**
   * Adds an image to a block.
   *
   * @param page - The landing page being edited.
   * @param blockId - The id of the target block.
   * @param image - The image fields (id, url, alt) to add.
   * @returns A successful result, or a failure when the block is missing,
   *   does not support images, or the image is invalid.
   */
  public addImage(
    page: LandingPage,
    blockId: string,
    image: { id: string; url: string; alt: string },
  ): Result<void> {
    const block = page.findBlock(blockId);
    if (!block) {
      return Result.fail<void>(`Block "${blockId}" was not found.`);
    }

    const imageResult = BlockImage.create(image);
    if (imageResult.isFailure) {
      return Result.fail<void>(imageResult.error);
    }

    return block.addImage(imageResult.value);
  }

  /**
   * Removes an image from a block by image id.
   *
   * @param page - The landing page being edited.
   * @param blockId - The id of the target block.
   * @param imageId - The id of the image to remove.
   * @returns A successful result, or a failure when block/image is missing.
   */
  public removeImage(
    page: LandingPage,
    blockId: string,
    imageId: string,
  ): Result<void> {
    const block = page.findBlock(blockId);
    if (!block) {
      return Result.fail<void>(`Block "${blockId}" was not found.`);
    }
    return block.removeImage(imageId);
  }
}
