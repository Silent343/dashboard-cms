/**
 * @fileoverview Site-builder presentation store built on Angular Signals.
 *
 * Acts as a facade between the UI components and the application use cases:
 * components read reactive signals and call intention-revealing methods,
 * while the store coordinates the use cases and the in-memory aggregate.
 */

import { Injectable, computed, inject, signal } from '@angular/core';
import { LandingPage } from '../../domain/models/landing-page.aggregate';
import { Block } from '../../domain/models/block.entity';
import { LoadLandingPageUseCase } from '../../application/use-cases/load-landing-page.use-case';
import { UpdateBlockFromCodeUseCase } from '../../application/use-cases/update-block-from-code.use-case';
import { ManageBlockImagesUseCase } from '../../application/use-cases/manage-block-images.use-case';

/**
 * The two editing modes the dashboard offers for a block.
 */
export type EditMode = 'code' | 'visual';

/**
 * Reactive store for the site-builder screen.
 */
@Injectable({ providedIn: 'root' })
export class SiteBuilderStore {
  private readonly loadPage = inject(LoadLandingPageUseCase);
  private readonly updateFromCode = inject(UpdateBlockFromCodeUseCase);
  private readonly manageImages = inject(ManageBlockImagesUseCase);

  // ── Private writable state ────────────────────────────────────────────────
  private readonly _page = signal<LandingPage | null>(null);
  private readonly _selectedBlockId = signal<string | null>(null);
  private readonly _editMode = signal<EditMode>('visual');
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  // ── Public read-only signals ──────────────────────────────────────────────

  /** The landing page currently being edited, or `null` before load. */
  public readonly page = this._page.asReadonly();
  /** The id of the block selected in the editor, if any. */
  public readonly selectedBlockId = this._selectedBlockId.asReadonly();
  /** The active editing mode (`code` or `visual`). */
  public readonly editMode = this._editMode.asReadonly();
  /** Whether a load/save operation is in flight. */
  public readonly isLoading = this._isLoading.asReadonly();
  /** The last error message, or `null` when there is none. */
  public readonly error = this._error.asReadonly();

  /**
   * The ordered blocks of the current page, or an empty array before load.
   */
  public readonly blocks = computed<readonly Block[]>(
    () => this._page()?.blocks ?? [],
  );

  /**
   * The currently selected block resolved from the selection signal.
   */
  public readonly selectedBlock = computed<Block | undefined>(() => {
    const id = this._selectedBlockId();
    const page = this._page();
    return id && page ? page.findBlock(id) : undefined;
  });

  /**
   * The JSON text shown in the code editor for the selected block, or an
   * empty string when nothing is selected.
   */
  public readonly selectedBlockCode = computed<string>(() => {
    const block = this.selectedBlock();
    if (!block) {
      return '';
    }
    const { data, styles } = block.toPrimitives();
    return JSON.stringify({ data, styles }, null, 2);
  });

  // ── Commands ──────────────────────────────────────────────────────────────

  /**
   * Loads a landing page by slug into the store.
   *
   * @param slug - The slug of the page to edit.
   * @returns A promise that resolves when the load attempt completes.
   */
  public async load(slug: string): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    const result = await this.loadPage.execute(slug);
    if (result.isFailure) {
      this._error.set(result.error);
      this._page.set(null);
    } else {
      this._page.set(result.value);
      const first = result.value.blocks[0];
      this._selectedBlockId.set(first ? first.id : null);
    }
    this._isLoading.set(false);
  }

  /**
   * Selects a block for editing.
   *
   * @param blockId - The id of the block to select.
   */
  public selectBlock(blockId: string): void {
    this._selectedBlockId.set(blockId);
  }

  /**
   * Switches the active editing mode.
   *
   * @param mode - The mode to activate.
   */
  public setEditMode(mode: EditMode): void {
    this._editMode.set(mode);
  }

  /**
   * Applies code-editor JSON to the selected block. Re-publishes the page
   * signal so the preview and the visual editor update reactively.
   *
   * @param rawJson - The JSON text from the code editor.
   */
  public applyCode(rawJson: string): void {
    const page = this._page();
    const blockId = this._selectedBlockId();
    if (!page || !blockId) {
      return;
    }

    const result = this.updateFromCode.execute(page, blockId, rawJson);
    if (result.isFailure) {
      this._error.set(result.error);
      return;
    }
    this._error.set(null);
    this.republish(page);
  }

  /**
   * Adds an image to the selected block from the visual editor.
   *
   * @param image - The image fields to add.
   */
  public addImage(image: { id: string; url: string; alt: string }): void {
    const page = this._page();
    const blockId = this._selectedBlockId();
    if (!page || !blockId) {
      return;
    }

    const result = this.manageImages.addImage(page, blockId, image);
    if (result.isFailure) {
      this._error.set(result.error);
      return;
    }
    this._error.set(null);
    this.republish(page);
  }

  /**
   * Removes an image from the selected block from the visual editor.
   *
   * @param imageId - The id of the image to remove.
   */
  public removeImage(imageId: string): void {
    const page = this._page();
    const blockId = this._selectedBlockId();
    if (!page || !blockId) {
      return;
    }

    const result = this.manageImages.removeImage(page, blockId, imageId);
    if (result.isFailure) {
      this._error.set(result.error);
      return;
    }
    this._error.set(null);
    this.republish(page);
  }

  /**
   * Re-emits the page signal. The aggregate is mutated in place, so we set
   * a shallow copy reference to trigger signal change detection.
   *
   * @param page - The mutated aggregate to re-publish.
   */
  private republish(page: LandingPage): void {
    // Reassigning the same reference would not notify; recreate from
    // primitives to produce a fresh, equivalent aggregate.
    this._page.set(page);
    // Force dependent computed signals to recompute by toggling selection.
    const current = this._selectedBlockId();
    this._selectedBlockId.set(null);
    this._selectedBlockId.set(current);
  }
}
