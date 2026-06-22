import { Routes } from '@angular/router';
import { SiteEditorComponent } from './contexts/site-builder/presentation/components/site-editor/site-editor.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'editor',
    pathMatch: 'full',
  },
  {
    path: 'editor',
    component: SiteEditorComponent,
  },
];
