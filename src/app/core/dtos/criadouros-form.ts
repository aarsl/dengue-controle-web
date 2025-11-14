import { Atividade } from "../models/atividade";

export interface CriadourosForm {
	criadouro: 'Sim' | 'Não';
	tiposCriadouros: string[];
	outrosCriadouros: string[];
	larvas: 'Sim' | 'Não';
	locaisLarvas: string[];
}

export function atividadeToCriadourosFormData(atividade: Atividade): CriadourosForm {
	return {
		criadouro: atividade.criadouro || 'Não',
		tiposCriadouros: atividade.tiposCriadouros || [],
		outrosCriadouros: atividade.outrosCriadouros || [],
		larvas: atividade.larvas || 'Não',
		locaisLarvas: atividade.locaisLarvas || []
	};
}

export function criadourosFormDataToAtividade(data: CriadourosForm): Partial<Atividade> {
	return {
		criadouro: data.criadouro,
		tiposCriadouros: data.tiposCriadouros,
		outrosCriadouros: data.outrosCriadouros,
		larvas: data.larvas,
		locaisLarvas: data.locaisLarvas
	};
}