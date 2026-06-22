/**
 * @fileoverview Dependency-injection wiring for the site-builder context.
 *
 * Binds the domain repository port to its concrete HTTP implementation,
 * honoring the Dependency Inversion Principle: the rest of the context
 * depends only on the interface.
 */

import { Provider } from '@angular/core';
import { LANDING_PAGE_REPOSITORY } from './domain/repositories/landing-page.repository';
import { HttpLandingPageRepository } from './infrastructure/repositories/http-landing-page.repository';

/**
 * Providers to register in the application/root or route config so the
 * site-builder use cases receive a working repository implementation.
 */
export const SITE_BUILDER_PROVIDERS: Provider[] = [
  {
    provide: LANDING_PAGE_REPOSITORY,
    useClass: HttpLandingPageRepository,
  },
];
