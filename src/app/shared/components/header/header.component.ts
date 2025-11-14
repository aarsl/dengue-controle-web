import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: false
})
export class HeaderComponent implements OnInit {
  menuAberto = false;
  rotaAtiva = '';

  menuItems = [
    { 
      id: 'menu-mapa',
      rota: '/mapa', 
      icone: 'fa-map-marked-alt', 
      texto: 'Mapa de Locais' 
    },
    { 
      id: 'menu-lista',
      rota: '/lista', 
      icone: 'fa-list', 
      texto: 'Lista de Atividades' 
    },
    { 
      id: 'menu-cadastro',
      rota: '/cadastro', 
      icone: 'fa-clipboard-list', 
      texto: 'Cadastro de Atividade' 
    },
    { 
      id: 'menu-relatorios',
      rota: '/relatorios', 
      icone: 'fa-chart-bar', 
      texto: 'Relatórios',
    }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Atualizar rota ativa
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.rotaAtiva = event.url;
        this.menuAberto = false;
      });
  }

  toggleMenu(): void {
    this.menuAberto = !this.menuAberto;
  }

  navegarPara(item: any): void {
    this.router.navigate([item.rota]);
  }

  isRotaAtiva(rota: string): boolean {
    return this.rotaAtiva === rota || 
           (rota === '/mapa' && this.rotaAtiva === '/');
  }
}