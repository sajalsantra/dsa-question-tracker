import { Routes } from '@angular/router';
import { AppLayoutComponent } from './layout/app-layout/app-layout.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: AppLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'questions',
        loadComponent: () =>
          import('./features/questions/questions.component').then(m => m.QuestionsComponent)
      },
      {
        path: 'revision',
        loadComponent: () =>
          import('./features/revision/revision.component').then(m => m.RevisionComponent)
      },
      {
        path: 'analytics',
        loadComponent: () =>
          import('./features/analytics/analytics.component').then(m => m.AnalyticsComponent)
      },
      {
        path: 'streak-goals',
        loadComponent: () =>
          import('./features/streak-goals/streak-goals.component').then(m => m.StreakGoalsComponent)
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings.component').then(m => m.SettingsComponent),
        canActivate: [authGuard]
      },
      {
        path: 'data-management',
        loadComponent: () =>
          import('./features/data-management/data-management.component').then(m => m.DataManagementComponent)
      },
    ]
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  { path: '**', redirectTo: '/dashboard' }
];
