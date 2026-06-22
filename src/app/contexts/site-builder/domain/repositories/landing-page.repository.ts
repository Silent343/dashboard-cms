/**
 * @fileoverview Repository port for the {@link LandingPage} aggregate.
 *
 * This is an interface owned by the domain layer (Dependency Inversion):
 * use cases depend on this abstraction, while the concrete HTTP
 * implementation lives in the infrastructure layer.
 */

import { Result } from '../../../../shared/core/result/result';
import { LandingPage } from '../models/landing-page.aggregate';

/**
 * Injection token string for the landing-page repository. Used to bind the
 * interface to its concrete implementation in Angular's DI container.
 */
export const LANDING_PAGE_REPOSITORY = 'LANDING_PAGE_REPOSITORY';

/**
 * Abstraction over persistence of {@link LandingPage} aggregates.
 *
 * All methods are asynchronous and return a {@link Result} so transport or
 * validation failures surface explicitly rather than as thrown exceptions.
 */
export interface LandingPageRepository {
  /**
   * Loads the landing page identified by the given slug.
   *
   * @param slug - The page slug.
   * @returns A result with the page, or a failure when missing/unreachable.
   */
  findBySlug(slug: string): Promise<Result<LandingPage>>;

  /**
   * Persists the full state of a landing page (slug, title and blocks).
   *
   * @param page - The aggregate to save.
   * @returns A result with the saved page, or a failure on error.
   */
  save(page: LandingPage): Promise<Result<LandingPage>>;
}
