import { Atividade } from "../models/atividade";
import { LocalVistoria } from "../models/local.vistoria";

export interface ConsultaDTO {
	localVistoria: LocalVistoria;
	atividades: Atividade[];
}