import { Routes } from '@angular/router';

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
        path: '**',
        redirectTo: '/mapa'
    }
];