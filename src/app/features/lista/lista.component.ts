import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LocalVistoriaService } from '../../core/services/local.vistoria.service';
import { ToastService } from '../../core/services/toast.service';
import { AtividadeService } from '../../core/services/atividade.service copy';

@Component({
	selector: 'app-lista',
	templateUrl: './lista.component.html',
	styleUrls: ['./lista.component.scss'],
	standalone: false
})
export class ListaComponent implements OnInit {

	atividades = signal<any[]>([]);
	atividadesFiltradas = signal<any[]>([]);
	
	paginaAtual = signal<number>(0);
	tamanhoPagina = signal<number>(10);
	totalPaginas = signal<number>(0);
	totalElementos = signal<number>(0);
	primeiraPagina = signal<boolean>(true);
	ultimaPagina = signal<boolean>(false);

	ordenarCampo = signal<string>('dataCadastro');
	ordenarDirecao = signal<'ASC' | 'DESC'>('DESC');
	
	tamanhosPagina = [10, 20, 50, 100];

	 Math = Math;

	constructor(
		private atividadeService: AtividadeService,
		private toast: ToastService,
		private router: Router) { }

	ngOnInit(): void {
		this.carregarAtividades();
	}

	carregarAtividades(page: number = this.paginaAtual(),
					   size: number = this.tamanhoPagina(),
				   	   sort: string = this.ordenarCampo(),
					   direction: 'ASC' | 'DESC' = this.ordenarDirecao()): void {
						
		this.atividadeService.listar(page, size, sort, direction)
			.subscribe(pageAtividades => {

			this.atividades.set(pageAtividades.content);
			this.atividadesFiltradas.set(pageAtividades.content);

			this.paginaAtual.set(pageAtividades.number);
			this.tamanhoPagina.set(pageAtividades.size);
			this.totalPaginas.set(pageAtividades.totalPages);
			this.totalElementos.set(pageAtividades.totalElements);
			this.primeiraPagina.set(pageAtividades.first);
			this.ultimaPagina.set(pageAtividades.last);
		});
	}

	irParaPagina(pagina: number): void {
		if (pagina >= 0 && pagina < this.totalPaginas()) {
		this.carregarAtividades(pagina, this.tamanhoPagina());
		}
	}

	primeiraPag(): void {
		this.irParaPagina(0);
	}

	paginaAnterior(): void {
		this.irParaPagina(this.paginaAtual() - 1);
	}

	proximaPagina(): void {
		this.irParaPagina(this.paginaAtual() + 1);
	}

	ultimaPag(): void {
		this.irParaPagina(this.totalPaginas() - 1);
	}

	alterarTamanhoPagina(novoTamanho: number): void {
		this.tamanhoPagina.set(novoTamanho);
		this.carregarAtividades(0, novoTamanho);
	}

	gerarPaginasVisiveis(): number[] {
		const atual = this.paginaAtual();
		const total = this.totalPaginas();
		const paginas: number[] = [];
		
		let inicio = Math.max(0, atual - 2);
		let fim = Math.min(total, inicio + 5);
		
		if (fim - inicio < 5) {
			inicio = Math.max(0, fim - 5);
		}
		
		for (let i = inicio; i < fim; i++) {
			paginas.push(i);
		}
		
		return paginas;
	}

	ordenarPor(campo: string): void {
		if (this.ordenarCampo() === campo) {
			this.ordenarDirecao.set(this.ordenarDirecao() === 'ASC' ? 'DESC' : 'ASC');
		} else {
			this.ordenarCampo.set(campo);
			this.ordenarDirecao.set('ASC');
		}
		this.carregarAtividades(0, this.tamanhoPagina(), this.ordenarCampo(), this.ordenarDirecao());
	}

	classeOrdenacao(campo: string) {
		return this.ordenarCampo() === campo ? this.ordenarDirecao().toLowerCase() : '';
	}

	visualizar(localVistoriaId: number): void {
		this.router.navigate(['/visualizacao', localVistoriaId]);
	}

	filtrar(): void {
		this.toast.error('Filtros ainda não implementados.');
	}

	exportarExcel(): void {
		this.toast.error('Exportar Excel ainda não implementado.');
	}

	formatarData(data: string): string {
		if (!data) return '';
		const d = new Date(data + 'T00:00:00');
		return d.toLocaleDateString('pt-BR');
	}
}