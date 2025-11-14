import { LocalLarva } from "./local-larva-dto";
import { TipoCriadouro } from "./tipo-criadouro-dto";

export interface EstatisticasCriadouros {
    tiposCriadouros: TipoCriadouro[];
    locaisLarvasMaisComuns: LocalLarva[];
}