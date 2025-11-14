import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LocalVistoriaService } from '../../core/services/local.vistoria.service';
import { ToastService } from '../../core/services/toast.service';
import { Atividade } from '../../core/models/atividade';
import { LocalVistoria } from '../../core/models/local.vistoria';
import { atividadeToCriadourosFormData, CriadourosForm } from '../../core/dtos/criadouros-form';

type AtividadeComCriadouros = Atividade & { criadourosData?: CriadourosForm };

@Component({
	selector: 'app-visualizacao',
	templateUrl: './visualizacao.component.html',
	styleUrls: ['./visualizacao.component.scss'],
	standalone: false
})
export class VisualizacaoComponent implements OnInit {
	
	localAtual?: LocalVistoria;
	atividades: AtividadeComCriadouros[] = [];
	abaAtiva = 0;
	carregando = signal(true);
	erro = false;

	tiposAcoes = [
		{ id: 'coleta', nome: 'Coleta realizada' },
		{ id: 'adesivo', nome: 'Adesivo aplicado' },
		{ id: 'aviso', nome: 'Aviso deixado' },
		{ id: 'orientacoes', nome: 'Orientações ao responsável' }
	];

	secoesEdicao: { [key: string]: boolean } = {
		imovel: false,
		localizacao: false
	};

	secoesEdicaoAtividade: { [atividadeIndex: number]: { [secao: string]: boolean } } = {};

	tabOffset = 0;
	tabsVisiveis = 2;

	constructor(
		private localVistoriaService: LocalVistoriaService,
		private toast: ToastService,
		private route: ActivatedRoute,
		private router: Router) { }

	ngOnInit(): void {
		this.route.params.subscribe(params => {
			const id = +params['id'];
			if (id) {
				this.carregarLocalVistoria(id);
			} else {
				this.erro = true;
				this.carregando.set(false);
			}
		});
	}

	carregarLocalVistoria(id: number): void {
		this.localVistoriaService.getById(id).subscribe({
			next: (resultado) => {
				if (resultado) {
					this.localAtual = resultado.localVistoria;
					this.atividades = resultado.atividades;
					this.carregarAtividades();
				} else {
					this.erro = true;
				}
			},
			error: () => {
				this.erro = true;
				this.carregando.set(false);
			}
		});
	}

	carregarAtividades(): void {
		if (!this.localAtual || !this.atividades) return;	
		
		this.atividades = this.atividades.map((a: any, idx) => {
			return this.prepararAtividade(a);
		});

		this.atividades.forEach((_, index) => {
			this.secoesEdicaoAtividade[index] = {
				'dados-atividade': false,
				'criadouros': false,
				'acoes': false,
				'retorno': false
			};
		});

		this.carregando.set(false);
	}

	private prepararAtividade(atividade: Atividade): AtividadeComCriadouros {
		console.log(atividade);
		return {
			...atividade,
			criadourosData: atividadeToCriadourosFormData(atividade)
		};
	}

	mudarAba(index: number): void {
		this.abaAtiva = index;
		this.ajustarOffset();
	}

	toggleEditSection(secao: string): void {
		const estaEditando = this.secoesEdicao[secao];

		if (estaEditando) {
			this.salvarDadosImovel(secao);
		}

		this.secoesEdicao[secao] = !estaEditando;
	}

	isSecaoEditando(secao: string): boolean {
		return this.secoesEdicao[secao];
	}

	private salvarDadosImovel(secao: string): void {
		if (!this.localAtual) return;

		console.log('Salvando dados do imóvel:', secao, this.localAtual);

		// Chamar serviço para atualizar apenas os dados do local
		// this.localVistoriaService.atualizarLocal(this.localAtual).subscribe({
		//   next: () => this.toast.info('Dados do imóvel atualizados'),
		//   error: (err) => this.toast.error('Erro ao atualizar: ' + err.message)
		// });

		this.toast.error('Funcionalidade de edição em construção');
	}

	toggleEditAtividade(index: number, secao: string): void {
		const estaEditando = this.secoesEdicaoAtividade[index][secao];

		if (estaEditando) {
			this.salvarDadosAtividade(index, secao);
		}

		this.secoesEdicaoAtividade[index][secao] = !estaEditando;
	}

	isAtividadeEditando(index: number, secao: string): boolean {
		return this.secoesEdicaoAtividade[index]?.[secao] || false;
	}

	private salvarDadosAtividade(index: number, secao: string): void {
		const atividade = this.atividades[index];
		if (!atividade) return;

		// Se editou a seção de criadouros, atualizar campos da atividade
		if (secao === 'criadouros' && atividade.criadourosData) {
			const criadourosData = atividade.criadourosData;
			Object.assign(atividade, {
				criadouro: criadourosData.criadouro,
				tiposCriadouros: criadourosData.tiposCriadouros,
				outrosCriadouros: criadourosData.outrosCriadouros,
				larvas: criadourosData.larvas,
				locaisLarvas: criadourosData.locaisLarvas
			});
		}

		console.log('Salvando dados da atividade:', secao, atividade);

		// Chamar serviço para atualizar a atividade
		// this.localVistoriaService.atualizarAtividade(atividade).subscribe({
		//   next: () => this.toast.info('Atividade atualizada'),
		//   error: (err) => this.toast.error('Erro ao atualizar: ' + err.message)
		// });

		this.toast.error('Funcionalidade de edição em construção');
	}

	toggleAcaoEdicao(index: number, acao: string, event: any): void {
		const atividade = this.atividades[index];
		if (!atividade.acoesRealizadas) {
			atividade.acoesRealizadas = [];
		}

		if (event.target.checked) {
			if (!atividade.acoesRealizadas.includes(acao)) {
				atividade.acoesRealizadas.push(acao);
			}
		} else {
			const idx = atividade.acoesRealizadas.indexOf(acao);
			if (idx >= 0) {
				atividade.acoesRealizadas.splice(idx, 1);
			}
		}
	}

	voltar(): void {
		this.router.navigate(['/lista']);
	}

	formatarData(data: string): string {
		console.log(data)
		if (!data) return '';
		const d = new Date(data);
		return d.toLocaleDateString('pt-BR');
	}

	get atividadesDoImovel(): AtividadeComCriadouros[] {
		console.log(this.atividades)
		return this.atividades;
	}

	get localVistoriaAtual(): LocalVistoria | undefined {
		return this.localAtual;
	}

	get atividadesFiltradas(): AtividadeComCriadouros[] {
		return this.atividadesDoImovel.slice(
			this.tabOffset, 
			this.tabOffset + this.tabsVisiveis
		);
	}

	avancarTabs(): void {
		if (this.podeAvancar) {
			this.abaAtiva++;
			this.ajustarOffset();
		}
	}

	voltarTabs(): void {
		if (this.podeVoltar) {
			this.abaAtiva--;
			this.ajustarOffset();
		}
	}

	private ajustarOffset(): void {
		if (this.abaAtiva < this.tabOffset) {
			this.tabOffset = this.abaAtiva;
		}
		else if (this.abaAtiva >= this.tabOffset + this.tabsVisiveis) {
			this.tabOffset = this.abaAtiva - this.tabsVisiveis + 1;
		}
	}
	
	getTabIndex(i: number): number {
		return this.tabOffset + i;
	}

	get podeAvancar(): boolean {
		return this.abaAtiva < this.atividadesDoImovel.length - 1;
	}
	
	get podeVoltar(): boolean {
		return this.abaAtiva > 0;
	}
}