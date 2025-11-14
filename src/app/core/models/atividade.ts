export interface Atividade {
	id?: any;
	localVistoriaId?: any;
	
	dataAtividade: String;
	tipoAtividade: TipoAtividade;
	agente: string;
	agenteAcomp1?: string;
	agenteAcomp2?: string;
	
	responsavel?: string;
	funcao?: TipoFuncao;
	
	criadouro?: 'Sim' | 'Não';
	tiposCriadouros?: string[];
	outrosCriadouros?: string[];
	
	larvas?: 'Sim' | 'Não';
	locaisLarvas?: string[];
	
	acoesRealizadas?: string[];
	observacao?: string;
	
	dataRetorno?: string;
	motivoRetorno?: string;
}

export type TipoAtividade =
	'Vistoria' | 'Ausente' | 'Recusa' | 'Vazio' | 'Retorno';

export type TipoFuncao =
	'Zelador' | 'Caseiro' | 'Proprietário' |
	'Funcionário' | 'Locatário' | 'Terceirizado';