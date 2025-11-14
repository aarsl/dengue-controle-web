import { Atividade } from "../models/atividade";
import { LocalVistoria } from "../models/local.vistoria";

export interface CadastroDTO {
	localVistoria: LocalVistoria;
	atividade: Atividade;
}