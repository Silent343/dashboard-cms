/**
 * @fileoverview Use case: load a landing page by slug.
 *
 * Application-layer orchestrator with a single responsibility (SRP). It
 * depends only on the repository port, never on a concrete implementation.
 */

import { Injectable, Inject } from '@angular/core';
import { Result } from '../../../../shared/core/result/result';
import { LandingPage } from '../../domain/models/landing-page.aggregate';
import {
  LandingPageRepository,
  LANDING_PAGE_REPOSITORY,
} from '../../domain/repositories/landing-page.repository';

/**
 * Loads the landing page for a given slug so the dashboard can edit it.
 */
@Injectable({ providedIn: 'root' })
export class LoadLandingPageUseCase {
  /**
   * @param repository - The landing-page repository port (injected).
   */
  constructor(
    @Inject(LANDING_PAGE_REPOSITORY)
    private readonly repository: LandingPageRepository,
  ) {}

  /**
   * Executes the use case.
   *
   * @param slug - The slug of the page to load.
   * @returns A result with the loaded {@link LandingPage}, or a failure.
   */
  public async execute(slug: string): Promise<Result<LandingPage>> {
    if (!slug || slug.trim().length === 0) {
      return Result.fail<LandingPage>('A slug is required to load a page.');
    }
    return this.repository.findBySlug(slug.trim());
  }
}
