import { Routes } from '@angular/router';
import { Home } from './features/home/pages/home/home';
import { Login } from './features/auth/pages/login/login';
import { Register } from './features/auth/pages/register/register';
import { MyListings } from './features/account/pages/my-listings/my-listings';
import { SavedProperties } from './features/account/pages/saved-properties/saved-properties';
import { MyEvaluations } from './features/account/pages/my-evaluations/my-evaluations';

export const routes: Routes = [
    { path: '', component: Home },
    { path: 'login', component: Login },
    { path: 'register', component: Register },
    { path: 'my-listings', component: MyListings },
    { path: 'saved-properties', component: SavedProperties },
    { path: 'my-evaluations', component: MyEvaluations },
    { path: '**', redirectTo: '' }
];
