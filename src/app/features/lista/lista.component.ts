import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';
import { AtividadeService } from '../../core/services/atividade.service';
import { LoadingService } from '../../core/services/loading.service';
import { FiltrosAtividade } from './filtros-modal/filtros-modal.component';

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

	modalFiltrosVisivel = false;
	filtrosAplicados: FiltrosAtividade = {};
	quantidadeFiltrosAtivos = 0;

	Math = Math;

	constructor(
		private atividadeService: AtividadeService,
		private toast: ToastService,
		private router: Router,
		private loadingService: LoadingService
	) { }

	ngOnInit(): void {
		this.carregarAtividades();
	}

	carregarAtividades(page: number = this.paginaAtual(),
					   size: number = this.tamanhoPagina(),
				   	   sort: string = this.ordenarCampo(),
					   direction: 'ASC' | 'DESC' = this.ordenarDirecao()): void {
		
		this.atividadeService.listar(page, size, sort, direction, this.filtrosAplicados)
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

	abrirModalFiltros(): void {
		this.modalFiltrosVisivel = true;
	}

	onFiltrosAplicados(filtros: any): void {
		this.filtrosAplicados = filtros;
		this.quantidadeFiltrosAtivos = this.contarFiltrosAtivos(filtros);

		this.carregarAtividades(0, this.tamanhoPagina());
		
		if (this.quantidadeFiltrosAtivos > 0) {
			this.toast.info(`${this.quantidadeFiltrosAtivos} filtro(s) aplicado(s)`);
		} else {
			this.toast.info('Nenhum filtro aplicado');
		}
	}

	contarFiltrosAtivos(filtros: FiltrosAtividade): number {
		return Object.values(filtros).filter(valor => 
			valor !== undefined && valor !== null && valor !== ''
		).length;
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
		this.abrirModalFiltros();
	}

	exportarExcel(): void {
		this.atividadeService.excel(this.filtrosAplicados).subscribe({
			next: (response) => {
				console.log(response)
				const blob = response.body;
				const contentDisposition = response.headers.get('content-disposition');
				
				let filename = `atividades_${this.obterDataArquivo()}.xlsx`;
				if (contentDisposition) {
					const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
					if (matches != null && matches[1]) {
						filename = matches[1].replace(/['"]/g, '');
					}
				}
				
				const url = window.URL.createObjectURL(blob!);
				const link = document.createElement('a');
				link.href = url;
				link.download = filename;
				link.click();
				window.URL.revokeObjectURL(url);
				
				if (this.quantidadeFiltrosAtivos > 0) {
					this.toast.info('Excel exportado com filtros aplicados');
				} else {
					this.toast.info('Excel exportado com sucesso');
				}
			},
			error: (error) => {
				console.error('Erro ao exportar Excel:', error);
				this.toast.error('Erro ao exportar Excel');
			}
		});
	}

	obterDataArquivo(): string {
		const agora = new Date();
		const pad = (n: any) => String(n).padStart(2, "0");
		return `${pad(agora.getDate())}_${pad(agora.getMonth() + 1)}_${agora.getFullYear()}_${pad(agora.getHours())}_${pad(agora.getMinutes())}`;
	}

	formatarData(data: string): string {
		if (!data) return '';
		const d = new Date(data + 'T00:00:00');
		return d.toLocaleDateString('pt-BR');
	}
}