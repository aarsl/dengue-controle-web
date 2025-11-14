import { Atividade } from "./atividade";

export interface LocalVistoria {
	id?: any;
	modulo: string;
	quadra: string;
	lote: string;
	logradouro: string;
	numero: string;
	condominio?: string;
	edificacao: TipoEdificacao;
	latitude: number;
	longitude: number;
}

export type TipoEdificacao =
	'Residência' | 'Edifício' | 'Village' |
	'Comércio' | 'Lote vazio' | 'Obra';