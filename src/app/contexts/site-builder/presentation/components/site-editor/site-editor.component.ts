/**
 * @fileoverview Site editor screen: the dual code/visual editor with a live
 * preview. This is the central component of the site-builder context.
 *
 * Layout:
 * - Left rail: the ordered list of blocks (selectable).
 * - Center: the editor — either the JSON code editor or the visual form,
 *   depending on the active mode.
 * - Right: a live preview that re-renders as the page signal changes.
 */

import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SiteBuilderStore, EditMode } from '../../stores/site-builder.store';

/**
 * Dual-mode landing-page editor with live preview.
 */
@Component({
  selector: 'app-site-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './site-editor.component.html',
  styleUrl: './site-editor.component.css',
})
export class SiteEditorComponent implements OnInit {
  /** The presentation store (facade over the use cases). */
  protected readonly store = inject(SiteBuilderStore);

  /** Local draft of the code editor text, kept in sync with the textarea. */
  protected readonly codeDraft = signal<string>('');

  /** The slug to load. In a real app this comes from the route. */
  private readonly slug = 'andrea-torres';

  /**
   * Loads the page and seeds the code draft once data is available.
   */
  public async ngOnInit(): Promise<void> {
    await this.store.load(this.slug);
    this.codeDraft.set(this.store.selectedBlockCode());
  }

  /**
   * Selects a block and refreshes the code draft to match it.
   *
   * @param blockId - The id of the block the user clicked.
   */
  protected onSelectBlock(blockId: string): void {
    this.store.selectBlock(blockId);
    this.codeDraft.set(this.store.selectedBlockCode());
  }

  /**
   * Switches the editing mode and, when entering code mode, refreshes the
   * draft from the current block state.
   *
   * @param mode - The mode to activate.
   */
  protected onSetMode(mode: EditMode): void {
    this.store.setEditMode(mode);
    if (mode === 'code') {
      this.codeDraft.set(this.store.selectedBlockCode());
    }
  }

  /**
   * Applies the current code draft to the selected block.
   */
  protected onApplyCode(): void {
    this.store.applyCode(this.codeDraft());
  }

  /**
   * Updates a single field of the selected block from the visual editor.
   *
   * @param key - The field name to set.
   * @param value - The new value.
   */
  protected onVisualFieldChange(key: string, value: string): void {
    const block = this.store.selectedBlock();
    if (!block) {
      return;
    }
    const next = { data: { ...block.data, [key]: value }, styles: block.styles };
    this.store.applyCode(JSON.stringify(next));
  }

  /**
   * Adds a placeholder image to the selected block. In the full app the URL
   * comes from the media-upload flow; here we use a generated id + URL.
   */
  protected onAddImage(): void {
    const id = `img_${Date.now().toString(36)}`;
    this.store.addImage({
      id,
      url: `https://picsum.photos/seed/${id}/800/500`,
      alt: 'New image',
    });
  }

  /**
   * Removes an image from the selected block.
   *
   * @param imageId - The id of the image to remove.
   */
  protected onRemoveImage(imageId: string): void {
    this.store.removeImage(imageId);
  }

  /**
   * Builds a minimal HTML preview string for a block from its primitives.
   * Kept intentionally simple; the production renderer mirrors the public
   * landing's components.
   *
   * @param blockType - The block type literal.
   * @param data - The block's content payload.
   * @returns An HTML fragment string for the preview pane.
   */
  protected renderBlockPreview(
    blockType: string,
    data: Record<string, unknown>,
  ): string {
    switch (blockType) {
      case 'HERO':
        return `<header class="pv-hero"><h1>${this.escape(data['title'])}</h1>
          <p>${this.escape(data['subtitle'])}</p></header>`;
      case 'TEXT':
        return `<section class="pv-text"><p>${this.escape(data['body'])}</p></section>`;
      case 'IMAGE_GALLERY': {
        const images = Array.isArray(data['images']) ? data['images'] : [];
        const imgs = images
          .map(
            (img: { url?: string; alt?: string }) =>
              `<img src="${this.escape(img.url)}" alt="${this.escape(img.alt)}" />`,
          )
          .join('');
        return `<section class="pv-gallery">${imgs}</section>`;
      }
      default:
        return `<section class="pv-generic">[${blockType}]</section>`;
    }
  }

  /**
   * Escapes a value for safe interpolation into the preview HTML string.
   *
   * @param value - The value to escape.
   * @returns An HTML-escaped string.
   */
  private escape(value: unknown): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
