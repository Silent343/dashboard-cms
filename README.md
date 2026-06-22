# Site Builder — Core (Angular + DDD/Clean Architecture)

Núcleo del contexto `site-builder` para el CMS de landing pages.
Modo dual de edición (código ↔ visual) sobre una única fuente de verdad
basada en bloques tipados JSON.

## Estructura (Clean Architecture)

```
src/app/contexts/site-builder/
├── domain/                         # Lógica pura, sin Angular ni HTTP
│   ├── models/
│   │   ├── block.entity.ts         # Entidad Block (métodos código + visual)
│   │   └── landing-page.aggregate.ts  # Aggregate root (orden, reorder)
│   ├── value-objects/
│   │   ├── block-id.vo.ts
│   │   ├── block-type.vo.ts        # HERO, TEXT, IMAGE_GALLERY, ...
│   │   ├── block-image.vo.ts
│   │   └── slug.vo.ts
│   └── repositories/
│       └── landing-page.repository.ts  # Puerto (interface)
├── application/                    # Casos de uso (orquestación)
│   ├── use-cases/
│   │   ├── load-landing-page.use-case.ts
│   │   ├── update-block-from-code.use-case.ts   # modo código
│   │   └── manage-block-images.use-case.ts      # modo visual
│   ├── dtos/landing-page.dto.ts
│   └── mappers/landing-page.mapper.ts
├── infrastructure/                 # Implementación concreta
│   └── repositories/http-landing-page.repository.ts
├── presentation/                   # UI Angular
│   ├── stores/site-builder.store.ts   # Signals store (facade)
│   └── components/site-editor/        # Editor dual + preview
└── site-builder.providers.ts       # DI: puerto -> implementación
```

## Clave del diseño

El modo código y el modo visual editan el MISMO objeto `block.data`:
- **Código**: `UpdateBlockFromCodeUseCase` parsea JSON -> `block.replaceContent()`
- **Visual**: `ManageBlockImagesUseCase` -> `block.addImage()` / `removeImage()`

Una galería creada en código es editable visualmente (y viceversa) porque
nunca hay dos representaciones — una sola fuente de verdad.

## Endpoints REST esperados (backend Spring Boot)

- `GET /api/v1/sites/{slug}`  -> LandingPageDto
- `PUT /api/v1/sites/{slug}`  -> LandingPageDto

## Validado

Capa de dominio compila con `strict: true` y pasa 24 tests funcionales
(sincronización código↔visual, invariantes, orden de bloques).
