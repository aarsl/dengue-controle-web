import { Routes } from '@angular/router';
import { RelatoriosComponent } from './features/relatorios/relatorios.component';

export const routes: Routes = [
    {
        path: '',
        redirectTo: '/mapa',
        pathMatch: 'full'
    },
    {
        path: 'mapa',
        loadChildren: () => import('./features/mapa/mapa.module')
        .then(m => m.MapaModule)
    },
    {
        path: 'cadastro',
        loadChildren: () => import('./features/cadastro/cadastro.module')
        .then(m => m.CadastroModule)
    },
    {
        path: 'lista',
        loadChildren: () => import('./features/lista/lista.module')
        .then(m => m.ListaModule)
    },
    {
        path: 'visualizacao/:id',
        loadChildren: () => import('./features/visualizacao/visualizacao.module')
        .then(m => m.VisualizacaoModule)
    },
    {
        path: 'relatorios',
        loadChildren: () => import('./features/relatorios/relatorios.module')
        .then(m => m.RelatoriosModule)
    },
    {
        path: '**',
        redirectTo: '/mapa'
    }
];