import { DistribuicaoAtividade } from "./distribuicao-atividade-dto";
import { EstatisticasCriadouros } from "./estatisticas-criadouros-dto";
import { EvolucaoMensal } from "./evolucao-mensal-dto";
import { Indicadores } from "./indicadores-dto";
import { Ranking } from "./ranking-dto";

export interface Relatorio {
    indicadores: Indicadores;
    top10ModulosLarvas: Ranking[];
    distribuicaoAtividades: DistribuicaoAtividade[];
    evolucaoMensal: EvolucaoMensal[];
    estatisticasCriadouros: EstatisticasCriadouros;
}