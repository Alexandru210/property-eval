import { Routes } from '@angular/router';
import { adminGuard } from './core/admin.guard';
import { authGuard } from './core/auth.guard';
import { staffGuard } from './core/staff.guard';

export const routes: Routes = [
    { path: '', loadComponent: () => import('./features/home/pages/home/home').then((m) => m.Home) },
    { path: 'buy', loadComponent: () => import('./features/marketplace/pages/buy/buy').then((m) => m.Buy) },
    { path: 'listings/:id', loadComponent: () => import('./features/marketplace/pages/listing-detail/listing-detail').then((m) => m.ListingDetail) },
    { path: 'sell', loadComponent: () => import('./features/marketplace/pages/sell/sell').then((m) => m.Sell), canActivate: [authGuard] },
    { path: 'evaluate', loadComponent: () => import('./features/evaluation/pages/evaluate/evaluate').then((m) => m.Evaluate), canActivate: [authGuard] },
    { path: 'evaluation-workbench', loadComponent: () => import('./features/evaluation/pages/evaluation-workbench/evaluation-workbench').then((m) => m.EvaluationWorkbench), canActivate: [authGuard, staffGuard] },
    { path: 'admin', loadComponent: () => import('./features/admin/pages/admin-dashboard/admin-dashboard').then((m) => m.AdminDashboard), canActivate: [authGuard, adminGuard] },
    { path: 'login', loadComponent: () => import('./features/auth/pages/login/login').then((m) => m.Login) },
    { path: 'register', loadComponent: () => import('./features/auth/pages/register/register').then((m) => m.Register) },
    { path: 'my-listings', loadComponent: () => import('./features/account/pages/my-listings/my-listings').then((m) => m.MyListings), canActivate: [authGuard] },
    { path: 'saved-properties', loadComponent: () => import('./features/account/pages/saved-properties/saved-properties').then((m) => m.SavedProperties), canActivate: [authGuard] },
    { path: 'my-evaluations', loadComponent: () => import('./features/account/pages/my-evaluations/my-evaluations').then((m) => m.MyEvaluations), canActivate: [authGuard] },
    { path: '**', redirectTo: '' }
];
