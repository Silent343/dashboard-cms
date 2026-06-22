/**
 * @fileoverview HTTP implementation of the {@link LandingPageRepository}
 * port. Lives in the infrastructure layer and is the only place that knows
 * about the REST endpoints and the HTTP client.
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Result } from '../../../../shared/core/result/result';
import { LandingPage } from '../../domain/models/landing-page.aggregate';
import { LandingPageRepository } from '../../domain/repositories/landing-page.repository';
import { LandingPageDto } from '../../application/dtos/landing-page.dto';
import { LandingPageMapper } from '../../application/mappers/landing-page.mapper';
import { environment } from '../../../../../environments/environment';

/**
 * Talks to the backend landing-page REST resource.
 *
 * Endpoint conventions (REST):
 * - `GET    /sites/{slug}` — fetch a page.
 * - `PUT    /sites/{slug}` — replace a page's full state.
 */
@Injectable({ providedIn: 'root' })
export class HttpLandingPageRepository implements LandingPageRepository {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/sites`;

  /**
   * Fetches a landing page by slug and maps it to the domain aggregate.
   *
   * @param slug - The page slug.
   * @returns A result with the page, or a failure on transport/mapping error.
   */
  public async findBySlug(slug: string): Promise<Result<LandingPage>> {
    try {
      const dto = await firstValueFrom(
        this.http.get<LandingPageDto>(`${this.baseUrl}/${slug}`),
      );
      return LandingPageMapper.toDomain(dto);
    } catch (error) {
      return Result.fail<LandingPage>(
        `Could not load page "${slug}": ${this.describe(error)}`,
      );
    }
  }

  /**
   * Persists the full state of a landing page via PUT.
   *
   * @param page - The aggregate to save.
   * @returns A result with the saved page, or a failure on error.
   */
  public async save(page: LandingPage): Promise<Result<LandingPage>> {
    try {
      const dto = LandingPageMapper.toDto(page);
      const saved = await firstValueFrom(
        this.http.put<LandingPageDto>(`${this.baseUrl}/${dto.slug}`, dto),
      );
      return LandingPageMapper.toDomain(saved);
    } catch (error) {
      return Result.fail<LandingPage>(
        `Could not save page: ${this.describe(error)}`,
      );
    }
  }

  /**
   * Produces a short, human-readable description of an unknown error.
   *
   * @param error - The caught error.
   * @returns A printable message.
   */
  private describe(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return 'unexpected error';
  }
}
