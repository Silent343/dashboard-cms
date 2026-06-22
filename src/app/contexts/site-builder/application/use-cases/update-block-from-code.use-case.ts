/**
 * @fileoverview Use case: update a block's content from the code editor.
 *
 * The code editor hands over raw JSON text the user typed. This use case
 * parses and validates it, then replaces the target block's payload through
 * the aggregate so both editing modes stay consistent.
 */

import { Injectable } from '@angular/core';
import { Result } from '../../../../shared/core/result/result';
import { LandingPage } from '../../domain/models/landing-page.aggregate';
import { BlockData, BlockStyles } from '../../domain/models/block.entity';

/**
 * The parsed payload expected from the code editor for a single block.
 */
interface ParsedBlockPayload {
  /** Structured content fields. */
  data: BlockData;
  /** Optional inline style overrides. */
  styles?: BlockStyles;
}

/**
 * Applies code-editor changes to one block of a landing page.
 */
@Injectable({ providedIn: 'root' })
export class UpdateBlockFromCodeUseCase {
  /**
   * Executes the use case against an in-memory aggregate.
   *
   * The aggregate is mutated in place; persistence is handled separately by
   * a save use case so the editor can debounce/batch saves.
   *
   * @param page - The landing page being edited.
   * @param blockId - The id of the block to update.
   * @param rawJson - The JSON text from the code editor.
   * @returns A successful result, or a failure on invalid JSON, missing
   *   block, or domain rejection.
   */
  public execute(
    page: LandingPage,
    blockId: string,
    rawJson: string,
  ): Result<void> {
    const block = page.findBlock(blockId);
    if (!block) {
      return Result.fail<void>(`Block "${blockId}" was not found on this page.`);
    }

    let parsed: ParsedBlockPayload;
    try {
      parsed = JSON.parse(rawJson) as ParsedBlockPayload;
    } catch {
      return Result.fail<void>('The code is not valid JSON.');
    }

    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return Result.fail<void>('Expected a JSON object with a "data" field.');
    }
    if (parsed.data === undefined || typeof parsed.data !== 'object') {
      return Result.fail<void>('The JSON must contain a "data" object.');
    }

    return block.replaceContent(parsed.data, parsed.styles);
  }
}
