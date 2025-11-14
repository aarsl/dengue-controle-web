import { Component, OnInit, signal } from '@angular/core';
import { RelatorioService} from '../../core/services/relatorio.service';
import { ToastService } from '../../core/services/toast.service';
import { Relatorio } from '../../core/dtos/relatorio/relatorio-dto';

@Component({
    selector: 'app-relatorios',
    templateUrl: './relatorios.component.html',
    styleUrls: ['./relatorios.component.scss'],
    standalone: false
})
export class RelatoriosComponent implements OnInit {
    
    relatorio: Relatorio = {} as Relatorio;
    
    // Filtros de data
    dataAtividadeInicio: string = '';
    dataAtividadeFim: string = '';
    dataInicioOriginal: string = '';
    dataFimOriginal: string = '';
    
    // Estados de carregamento individuais
    carregandoIndicadores = signal(false);
    carregandoRankings = signal(false);
    carregandoDistribuicao = signal(false);
    carregandoEvolucao = signal(false);
    carregandoCriadouros = signal(false);
    carregandoGeral = signal(false);
    
    // Estados de erro individuais
    erroIndicadores = signal(false);
    erroRankings = signal(false);
    erroDistribuicao = signal(false);
    erroEvolucao = signal(false);
    erroCriadouros = signal(false);
    
    maxAtividades = 0;
    maxCriadouros = 0;
    maxLocais = 0;

    constructor(
        private relatorioService: RelatorioService,
        private toast: ToastService
    ) { }

    ngOnInit(): void {
        this.inicializarDatasDefault();
        this.carregarTodosRelatorios();
    }

    private inicializarDatasDefault(): void {
        const hoje = new Date();
        const mesAtual = hoje.getMonth();
        const anoAtual = hoje.getFullYear();
        
        let dataInicio: Date;
        let dataFim: Date;
        
        if (mesAtual === 11 || mesAtual <= 2) {
            if (mesAtual === 11) {
                dataInicio = new Date(anoAtual, 11, 1);
                dataFim = new Date(anoAtual + 1, 3, 1);
            } else {
                dataInicio = new Date(anoAtual - 1, 11, 1);
                dataFim = new Date(anoAtual, 3, 1);
            }
        } else {
            dataInicio = new Date(anoAtual - 1, 11, 1);
            dataFim = new Date(anoAtual, 3, 1);
        }
        
        this.dataAtividadeInicio = this.formatarDataParaInput(dataInicio);
        this.dataAtividadeFim = this.formatarDataParaInput(dataFim);
        this.dataInicioOriginal = this.dataAtividadeInicio;
        this.dataFimOriginal = this.dataAtividadeFim;
    }

    private formatarDataParaInput(data: Date): string {
        const ano = data.getFullYear();
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const dia = String(data.getDate()).padStart(2, '0');
        return `${ano}-${mes}-${dia}`;
    }

    avancarAno(): void {
        if (this.algumCarregando()) return;

        if(!this.periodoValido) {
            this.toast.error('Período inválido para avançar ano');
            return;
        }

        const inicio = new Date(this.dataAtividadeInicio + 'T00:00:00');
        const fim = new Date(this.dataAtividadeFim + 'T00:00:00');

        inicio.setFullYear(inicio.getFullYear() + 1);
        fim.setFullYear(fim.getFullYear() + 1);

        this.dataAtividadeInicio = this.formatarDataParaInput(inicio);
        this.dataAtividadeFim = this.formatarDataParaInput(fim);

        this.dataInicioOriginal = this.dataAtividadeInicio;
        this.dataFimOriginal = this.dataAtividadeFim;
        this.carregarTodosRelatorios();
    }

    retrocederAno(): void {
        if (this.algumCarregando()) return;

        if(!this.periodoValido) {
            this.toast.error('Período inválido para retroceder ano');
            return;
        }

        const inicio = new Date(this.dataAtividadeInicio + 'T00:00:00');
        const fim = new Date(this.dataAtividadeFim + 'T00:00:00');

        inicio.setFullYear(inicio.getFullYear() - 1);
        fim.setFullYear(fim.getFullYear() - 1);

        this.dataAtividadeInicio = this.formatarDataParaInput(inicio);
        this.dataAtividadeFim = this.formatarDataParaInput(fim);

        this.dataInicioOriginal = this.dataAtividadeInicio;
        this.dataFimOriginal = this.dataAtividadeFim;
        this.carregarTodosRelatorios();
    }

    get datasForamModificadas(): boolean {
        return this.dataAtividadeInicio !== this.dataInicioOriginal || 
               this.dataAtividadeFim !== this.dataFimOriginal;
    }

    get periodoValido(): boolean {
        if (!this.dataAtividadeInicio || !this.dataAtividadeFim) {
            return false;
        }
        
        const inicio = new Date(this.dataAtividadeInicio);
        const fim = new Date(this.dataAtividadeFim);
        
        if (inicio >= fim) {
            return false;
        }
        
        const mesesDiferenca = this.calcularMesesDiferenca(inicio, fim);
        return mesesDiferenca <= 24;
    }

    private calcularMesesDiferenca(inicio: Date, fim: Date): number {
        const anos = fim.getFullYear() - inicio.getFullYear();
        const meses = fim.getMonth() - inicio.getMonth();
        return anos * 12 + meses;
    }

    get botaoCalcularHabilitado(): boolean {
        return this.datasForamModificadas && this.periodoValido && !this.algumCarregando();
    }

    algumCarregando(): boolean {
        return this.carregandoIndicadores() || this.carregandoRankings() || 
               this.carregandoDistribuicao() || this.carregandoEvolucao() || 
               this.carregandoCriadouros();
    }

    calcularRelatorios(): void {
        if (!this.botaoCalcularHabilitado) {
            return;
        }
        
        this.dataInicioOriginal = this.dataAtividadeInicio;
        this.dataFimOriginal = this.dataAtividadeFim;
        this.carregarTodosRelatorios();
    }

    private carregarTodosRelatorios(): void {
        this.carregarIndicadores();
        setTimeout(() => this.carregarRankings(), 100);
        setTimeout(() => this.carregarDistribuicao(), 200);
        setTimeout(() => this.carregarEvolucao(), 300);
        setTimeout(() => this.carregarCriadouros(), 400);
    }

    carregarIndicadores(): void {
        this.carregandoIndicadores.set(true);
        this.erroIndicadores.set(false);

        this.relatorioService.obterIndicadores(
            this.dataAtividadeInicio, 
            this.dataAtividadeFim
        ).subscribe({
            next: (data) => {
                this.relatorio.indicadores = data;
                this.carregandoIndicadores.set(false);
            },
            error: (error) => {
                console.error('Erro ao carregar indicadores:', error);
                this.erroIndicadores.set(true);
                this.carregandoIndicadores.set(false);
                this.toast.error('Erro ao carregar indicadores');
            }
        });
    }

    carregarRankings(): void {
        this.carregandoRankings.set(true);
        this.erroRankings.set(false);

        this.relatorioService.obterTop10ModulosLarvas(
            this.dataAtividadeInicio, 
            this.dataAtividadeFim
        ).subscribe({
            next: (modulos) => {
                this.relatorio.top10ModulosLarvas = modulos || [];
                this.carregandoRankings.set(false);
            },
            error: (error) => {
                console.error('Erro ao carregar rankings:', error);
                this.erroRankings.set(true);
                this.carregandoRankings.set(false);
            }
        });
    }

    carregarDistribuicao(): void {
        this.carregandoDistribuicao.set(true);
        this.erroDistribuicao.set(false);

        this.relatorioService.obterDistribuicaoAtividades(
            this.dataAtividadeInicio, 
            this.dataAtividadeFim
        ).subscribe({
            next: (data) => {
                this.relatorio.distribuicaoAtividades = data;
                this.carregandoDistribuicao.set(false);
            },
            error: (error) => {
                console.error('Erro ao carregar distribuição:', error);
                this.erroDistribuicao.set(true);
                this.carregandoDistribuicao.set(false);
            }
        });
    }

    carregarEvolucao(): void {
        this.carregandoEvolucao.set(true);
        this.erroEvolucao.set(false);

        this.relatorioService.obterEvolucaoMensal(
            this.dataAtividadeInicio, 
            this.dataAtividadeFim
        ).subscribe({
            next: (data) => {
                this.relatorio.evolucaoMensal = data;
                this.calcularMaxAtividades();
                this.carregandoEvolucao.set(false);
            },
            error: (error) => {
                console.error('Erro ao carregar evolução:', error);
                this.erroEvolucao.set(true);
                this.carregandoEvolucao.set(false);
            }
        });
    }

    carregarCriadouros(): void {
        this.carregandoCriadouros.set(true);
        this.erroCriadouros.set(false);

        this.relatorioService.obterEstatisticasCriadouros(
            this.dataAtividadeInicio, 
            this.dataAtividadeFim
        ).subscribe({
            next: (data) => {
                this.relatorio.estatisticasCriadouros = data;
                this.calcularMaxCriadouros();
                this.calcularMaxLocais();
                this.carregandoCriadouros.set(false);
            },
            error: (error) => {
                console.error('Erro ao carregar criadouros:', error);
                this.erroCriadouros.set(true);
                this.carregandoCriadouros.set(false);
            }
        });
    }

    private calcularMaxAtividades(): void {
        if (!this.relatorio?.evolucaoMensal) return;
        
        this.maxAtividades = Math.max(
            ...this.relatorio.evolucaoMensal.map((m: { totalAtividades: any; }) => m.totalAtividades),
            1
        );
    }

    private calcularMaxCriadouros(): void {
        if (!this.relatorio?.estatisticasCriadouros?.tiposCriadouros?.length) return;
        
        this.maxCriadouros = Math.max(
            ...this.relatorio.estatisticasCriadouros.tiposCriadouros.map((t: { quantidade: any; }) => t.quantidade),
            1
        );
    }

    private calcularMaxLocais(): void {
        if (!this.relatorio?.estatisticasCriadouros?.locaisLarvasMaisComuns?.length) return;
        
        this.maxLocais = Math.max(
            ...this.relatorio.estatisticasCriadouros.locaisLarvasMaisComuns.map((l: { quantidade: any; }) => l.quantidade),
            1
        );
    }

    get carregando(): boolean {
        return this.carregandoIndicadores() && !this.relatorio.indicadores;
    }

    get erro(): boolean {
        return this.erroIndicadores() && !this.relatorio.indicadores;
    }

    recarregarSecao(secao: string): void {
        switch(secao) {
            case 'indicadores':
                this.carregarIndicadores();
                break;
            case 'rankings':
                this.carregarRankings();
                break;
            case 'distribuicao':
                this.carregarDistribuicao();
                break;
            case 'evolucao':
                this.carregarEvolucao();
                break;
            case 'criadouros':
                this.carregarCriadouros();
                break;
        }
    }

    getBarHeight(value: number, max: number): number {
        if (max === 0) return 0;
        return (value / max) * 100;
    }

    getBarWidthCriadouro(value: number): number {
        if (this.maxCriadouros === 0) return 0;
        return (value / this.maxCriadouros) * 100;
    }

    getBarWidthLocal(value: number): number {
        if (this.maxLocais === 0) return 0;
        return (value / this.maxLocais) * 100;
    }

    formatarMes(mes: string): string {
        const meses = [
            'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
            'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
        ];
        
        const [ano, mesNum] = mes.split('-');
        return `${meses[parseInt(mesNum) - 1]}/${ano.substring(2)}`;
    }

    formatarTipoAtividade(tipo: string): string {
        const tipos: { [key: string]: string } = {
            'VISTORIA': 'Vistoria',
            'AUSENTE': 'Ausente',
            'RECUSA': 'Recusa',
            'VAZIO': 'Lote Vazio',
            'RETORNO': 'Retorno'
        };
        return tipos[tipo] || tipo;
    }

    getIconeAtividade(tipo: string): string {
        const icones: { [key: string]: string } = {
            'VISTORIA': 'fa-clipboard-check',
            'AUSENTE': 'fa-user-times',
            'RECUSA': 'fa-ban',
            'VAZIO': 'fa-warehouse',
            'RETORNO': 'fa-redo-alt'
        };
        return icones[tipo] || 'fa-circle';
    }

    get mensagemErroPeriodo(): string {
        if (!this.dataAtividadeInicio || !this.dataAtividadeFim) {
            return '';
        }
        
        const inicio = new Date(this.dataAtividadeInicio);
        const fim = new Date(this.dataAtividadeFim);
        
        if (inicio >= fim) {
            return 'A data fim deve ser maior que a data início';
        }
        
        const mesesDiferenca = this.calcularMesesDiferenca(inicio, fim);
        if (mesesDiferenca > 24) {
            return 'O período não pode superar 2 anos';
        }
        
        return '';
    }

    get primeirosCincoModulos() {
        return this.relatorio.top10ModulosLarvas?.slice(0, 5) || [];
    }

    get ultimosCincoModulos() {
        return this.relatorio.top10ModulosLarvas?.slice(5, 10) || [];
    }
}