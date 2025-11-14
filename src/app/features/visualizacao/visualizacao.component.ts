import { Component, OnInit, signal, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LocalVistoriaService } from '../../core/services/local.vistoria.service';
import { ToastService } from '../../core/services/toast.service';
import { Atividade } from '../../core/models/atividade';
import { LocalVistoria } from '../../core/models/local.vistoria';
import { atividadeToCriadourosFormData, CriadourosForm } from '../../core/dtos/criadouros-form';
import { AtividadeService } from '../../core/services/atividade.service';

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

	camposInvalidosImovel: Set<string> = new Set();
	camposInvalidosAtividade: { [atividadeIndex: number]: Set<string> } = {};

	tabOffset = 0;
	tabsVisiveis = 2;

	private localBackup?: LocalVistoria;
	private atividadesBackup: Map<number, AtividadeComCriadouros> = new Map();

	constructor(
		private localVistoriaService: LocalVistoriaService,
		private atividadeService: AtividadeService,
		private toast: ToastService,
		private route: ActivatedRoute,
		private router: Router,
		private el: ElementRef) { }

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
		
		this.atividades = this.atividades.map((a: any) => {
			return this.prepararAtividade(a);
		});

		this.atividades.forEach((_, index) => {
			this.secoesEdicaoAtividade[index] = {
				'dados-atividade': false,
				'criadouros': false,
				'acoes': false,
				'retorno': false
			};
			this.camposInvalidosAtividade[index] = new Set();
		});

		this.carregando.set(false);
	}

	private prepararAtividade(atividade: Atividade): AtividadeComCriadouros {
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
			if (!this.validarDadosImovel(secao)) {
				return;
			}
			this.salvarDadosImovel();
		} else {
			this.localBackup = JSON.parse(JSON.stringify(this.localAtual));
			this.camposInvalidosImovel.clear();
		}

		this.secoesEdicao[secao] = !estaEditando;
	}

	cancelarEdicaoLocal(secao: string): void {
		this.restaurarLocalBackup();
		this.secoesEdicao[secao] = false;
		this.camposInvalidosImovel.clear();
	}

	isSecaoEditando(secao: string): boolean {
		return this.secoesEdicao[secao];
	}

	isCampoInvalidoImovel(campo: string): boolean {
		return this.camposInvalidosImovel.has(campo);
	}

	private validarDadosImovel(secao: string): boolean {
		this.camposInvalidosImovel.clear();
		
		if (!this.localAtual) return false;

		let camposObrigatorios: string[] = [];

		if (secao === 'imovel') {
			camposObrigatorios = ['modulo', 'quadra', 'lote', 'logradouro', 'numero', 'edificacao'];
		} else if (secao === 'localizacao') {
			camposObrigatorios = ['latitude', 'longitude'];
		}

		camposObrigatorios.forEach(campo => {
			const valor = (this.localAtual as any)[campo];
			if (!valor || (typeof valor === 'string' && valor.trim() === '')) {
				this.camposInvalidosImovel.add(campo);
			}
		});

		if (this.camposInvalidosImovel.size > 0) {
			this.toast.error('Preencha todos os campos obrigatórios.');
			setTimeout(() => this.focarPrimeiroCampoInvalido(secao), 0);
			return false;
		}

		return true;
	}

	private focarPrimeiroCampoInvalido(secao: string): void {
		setTimeout(() => {
			const primeiroCampo = Array.from(this.camposInvalidosImovel)[0];
			const elemento = this.el.nativeElement.querySelector(`#${primeiroCampo}`);
			if (elemento) {
				elemento.focus();
				elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
			}
		}, 100);
	}

	private salvarDadosImovel(): void {
		if (!this.localAtual) return;

		const primeiraAtividade = this.atividades[0];
		if (!primeiraAtividade || !primeiraAtividade.id) {
			this.toast.error('Erro: Nenhuma atividade encontrada para atualizar o local');
			this.restaurarLocalBackup();
			return;
		}

		const localDTO = {
			id: this.localAtual.id,
			modulo: this.localAtual.modulo,
			quadra: this.localAtual.quadra,
			lote: this.localAtual.lote,
			logradouro: this.localAtual.logradouro,
			numero: this.localAtual.numero,
			condominio: this.localAtual.condominio,
			edificacao: this.localAtual.edificacao,
			latitude: this.localAtual.latitude,
			longitude: this.localAtual.longitude
		};

		this.localVistoriaService.atualizar(this.localAtual.id, localDTO).subscribe({
			next: () => {
				this.toast.info('Dados do local atualizados com sucesso');
				this.localBackup = undefined;
				this.camposInvalidosImovel.clear();
			},
			error: (err) => {
				this.toast.error('Erro ao atualizar: ' + err.message);
				this.restaurarLocalBackup();
			}
		});
	}

	private restaurarLocalBackup(): void {
		if (this.localBackup) {
			this.localAtual = JSON.parse(JSON.stringify(this.localBackup));
			this.localBackup = undefined;
		}
	}

	toggleEditAtividade(index: number, secao: string): void {
		const estaEditando = this.secoesEdicaoAtividade[index][secao];

		if (estaEditando) {
			if (!this.validarDadosAtividade(index, secao)) {
				return;
			}
			this.salvarDadosAtividade(index, secao);
		} else {
			const atividade = this.atividades[index];
			this.atividadesBackup.set(index, JSON.parse(JSON.stringify(atividade)));
			this.camposInvalidosAtividade[index].clear();
		}

		this.secoesEdicaoAtividade[index][secao] = !estaEditando;
	}

	cancelarEdicaoAtividade(index: number, secao: string): void {
		this.restaurarAtividadeBackup(index);
		this.secoesEdicaoAtividade[index][secao] = false;
		this.camposInvalidosAtividade[index].clear();
	}

	isAtividadeEditando(index: number, secao: string): boolean {
		return this.secoesEdicaoAtividade[index]?.[secao] || false;
	}

	isCampoInvalidoAtividade(index: number, campo: string): boolean {
		return this.camposInvalidosAtividade[index]?.has(campo) || false;
	}

	camposResponsavelObrigatorios(tipoAtividade: string): boolean {
		return ['Vistoria', 'Recusa', 'Retorno'].includes(tipoAtividade);
	}

	exibirCamposResponsavel(tipoAtividade: string): boolean {
		return this.camposResponsavelObrigatorios(tipoAtividade);
	}

	private validarDadosAtividade(index: number, secao: string): boolean {
		if (!this.camposInvalidosAtividade[index]) {
			this.camposInvalidosAtividade[index] = new Set();
		}
		this.camposInvalidosAtividade[index].clear();

		const atividade = this.atividades[index];
		if (!atividade) return false;

		let camposObrigatorios: string[] = [];

		if (secao === 'dados-atividade') {
			camposObrigatorios = ['dataAtividade', 'tipoAtividade', 'agente'];
			
			if (this.camposResponsavelObrigatorios(atividade.tipoAtividade)) {
				camposObrigatorios.push('responsavel', 'funcao');
			}
		}

		camposObrigatorios.forEach(campo => {
			const valor = (atividade as any)[campo];
			if (!valor || (typeof valor === 'string' && valor.trim() === '')) {
				this.camposInvalidosAtividade[index].add(campo);
			}
		});

		if (this.camposInvalidosAtividade[index].size > 0) {
			this.toast.error('Preencha todos os campos obrigatórios.');
			setTimeout(() => this.focarPrimeiroCampoInvalidoAtividade(index, secao), 0);
			return false;
		}

		return true;
	}

	private focarPrimeiroCampoInvalidoAtividade(index: number, secao: string): void {
		setTimeout(() => {
			const primeiroCampo = Array.from(this.camposInvalidosAtividade[index])[0];
			const seletorId = `#${secao}-${primeiroCampo}-${index}`;
			let elemento = this.el.nativeElement.querySelector(seletorId);
			
			if (!elemento) {
				const seletorGeral = `[data-campo="${primeiroCampo}"][data-atividade="${index}"]`;
				elemento = this.el.nativeElement.querySelector(seletorGeral);
			}

			if (elemento) {
				elemento.focus();
				elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
			}
		}, 100);
	}

	private salvarDadosAtividade(index: number, secao: string): void {
		const atividade = this.atividades[index];
		if (!atividade || !atividade.id) return;

		if (!this.exibirCamposResponsavel(atividade.tipoAtividade)) {
			atividade.responsavel = null;
			atividade.funcao = null;
		}

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

		const atividadeDTO = {
			id: atividade.id,
			dataAtividade: atividade.dataAtividade,
			tipoAtividade: atividade.tipoAtividade,
			agente: atividade.agente,
			agenteAcomp1: atividade.agenteAcomp1,
			agenteAcomp2: atividade.agenteAcomp2,
			responsavel: atividade.responsavel,
			funcao: atividade.funcao,
			criadouro: atividade.criadouro,
			tiposCriadouros: atividade.tiposCriadouros,
			outrosCriadouros: atividade.outrosCriadouros,
			larvas: atividade.larvas,
			locaisLarvas: atividade.locaisLarvas,
			acoesRealizadas: atividade.acoesRealizadas,
			observacao: atividade.observacao,
			dataRetorno: atividade.dataRetorno,
			motivoRetorno: atividade.motivoRetorno
		};

		this.atividadeService.atualizar(atividade.id, atividadeDTO).subscribe({
			next: () => {
				this.toast.info('Atividade atualizada com sucesso');
				this.atividades[index] = this.prepararAtividade(atividadeDTO);
				this.atividadesBackup.delete(index);
				this.camposInvalidosAtividade[index].clear();
			},
			error: (err) => {
				this.toast.error('Erro ao atualizar: ' + err.message);
				this.restaurarAtividadeBackup(index);
			}
		});
	}

	private restaurarAtividadeBackup(index: number): void {
		const backup = this.atividadesBackup.get(index);
		if (backup) {
			this.atividades[index] = JSON.parse(JSON.stringify(backup));
			this.atividadesBackup.delete(index);
		}
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
		if (!data) return '';
		const d = new Date(data);
		return d.toLocaleDateString('pt-BR');
	}

	get atividadesDoImovel(): AtividadeComCriadouros[] {
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