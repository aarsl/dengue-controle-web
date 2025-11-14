import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface FiltrosAtividade {
    atividadeId?: number;
    tipoAtividade?: string;
    modulo?: string;
    quadra?: string;
    lote?: string;
    logradouro?: string;
    condominio?: string;
    edificacao?: string;
    criadouro?: string;
    larvas?: string;
    tipoCriadouro?: string;
    agente?: string;
    dataAtividadeInicio?: string;
    dataAtividadeFim?: string;
    dataAgendamentoInicio?: string;
    dataAgendamentoFim?: string;
}

@Component({
    selector: 'app-filtros-modal',
    templateUrl: './filtros-modal.component.html',
    styleUrls: ['./filtros-modal.component.scss'],
    standalone: false
})
export class FiltrosModalComponent {
    @Input() visivel = false;
    @Output() visivelChange = new EventEmitter<boolean>();
    @Output() aplicarFiltros = new EventEmitter<FiltrosAtividade>();

    filtros: FiltrosAtividade = {};

    tiposAtividade = ['Vistoria', 'Ausente', 'Recusa', 'Lote vazio', 'Retorno'];
    
    tiposEdificacao = [
        { valor: 'RESIDENCIA', label: 'Residência' },
        { valor: 'EDIFICIO', label: 'Edifício' },
        { valor: 'VILLAGE', label: 'Village' },
        { valor: 'COMERCIO', label: 'Comércio' },
        { valor: 'LOTE_VAZIO', label: 'Lote vazio' },
        { valor: 'OBRA', label: 'Obra' }
    ];
    
	tiposCriadouros = [
        'Bromélia', 'Ravenala', 'Helicônia', 'Vaso de planta',
        'Pratinho de vaso', 'Fonte', 'Espelho d\'água', 'Piscinas',
        'Material inservível', 'Entulho', 'Balde', 'Pneu',
        'Lata/recipiente', 'Suporte de guarda-de-sol', 'Ralo',
        'Vaso sanitário', 'Lona', 'Caixa d\'água',
        'Brinquedo/Playground', 'Comedouro de animais', 'Calha'
    ];

    opcoesSimNao = [
        { valor: 'Sim', label: 'Sim' },
        { valor: 'Não', label: 'Não' }
    ];

    fechar(): void {
        this.visivel = false;
        this.visivelChange.emit(false);
    }

    fecharSeClickForaModal(event: MouseEvent): void {
        if ((event.target as HTMLElement).classList.contains('modal')) {
            this.fechar();
        }
    }

    aplicar(): void {
        this.aplicarFiltros.emit(this.filtros);
        this.fechar();
    }

    limpar(): void {
        this.filtros = {};
    }

    contarFiltrosAtivos(): number {
        return Object.values(this.filtros).filter(valor =>
            valor !== undefined && valor !== null && valor !== '').length;
    }
}