import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { forkJoin, map, Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { Indicadores } from '../dtos/relatorio/indicadores-dto';
import { Ranking } from '../dtos/relatorio/ranking-dto';
import { DistribuicaoAtividade } from '../dtos/relatorio/distribuicao-atividade-dto';
import { EvolucaoMensal } from '../dtos/relatorio/evolucao-mensal-dto';
import { EstatisticasCriadouros } from '../dtos/relatorio/estatisticas-criadouros-dto';
import { Relatorio } from '../dtos/relatorio/relatorio-dto';

@Injectable({
    providedIn: 'root'
})
export class RelatorioService {
    
    private baseUrl = `${environment.apiUrl}/relatorios`;
    
    constructor(private http: HttpClient) { }
    
    private criarParams(dataInicio?: string, dataFim?: string): HttpParams {
        let params = new HttpParams();
        
        if (dataInicio) {
            params = params.set('dataInicio', dataInicio);
        }
        if (dataFim) {
            params = params.set('dataFim', dataFim);
        }
        
        return params;
    }
    
    obterIndicadores(dataInicio?: string, dataFim?: string): Observable<Indicadores> {
        const params = this.criarParams(dataInicio, dataFim);
        return this.http.get<Indicadores>(`${this.baseUrl}/indicadores`, { params });
    }
    
    obterTop5QuadrasLarvas(dataInicio?: string, dataFim?: string): Observable<Ranking[]> {
        const params = this.criarParams(dataInicio, dataFim);
        return this.http.get<Ranking[]>(`${this.baseUrl}/ranking/quadras-larvas`, { params });
    }
    
    // ALTERADO: Top 10 módulos
    obterTop10ModulosLarvas(dataInicio?: string, dataFim?: string): Observable<Ranking[]> {
        const params = this.criarParams(dataInicio, dataFim);
        return this.http.get<Ranking[]>(`${this.baseUrl}/ranking/modulos-larvas`, { params });
    }
    
    obterDistribuicaoAtividades(dataInicio?: string, dataFim?: string): Observable<DistribuicaoAtividade[]> {
        const params = this.criarParams(dataInicio, dataFim);
        return this.http.get<DistribuicaoAtividade[]>(`${this.baseUrl}/distribuicao-atividades`, { params });
    }
    
    obterEvolucaoMensal(dataInicio?: string, dataFim?: string): Observable<EvolucaoMensal[]> {
        const params = this.criarParams(dataInicio, dataFim);
        return this.http.get<EvolucaoMensal[]>(`${this.baseUrl}/evolucao-mensal`, { params });
    }
    
    obterEstatisticasCriadouros(dataInicio?: string, dataFim?: string): Observable<EstatisticasCriadouros> {
        const params = this.criarParams(dataInicio, dataFim);
        return this.http.get<EstatisticasCriadouros>(`${this.baseUrl}/estatisticas-criadouros`, { params });
    }
    
    obterRelatorioCompleto(dataInicio?: string, dataFim?: string): Observable<Relatorio> {
        return forkJoin({
            indicadores: this.obterIndicadores(dataInicio, dataFim),
            top10ModulosLarvas: this.obterTop10ModulosLarvas(dataInicio, dataFim),
            distribuicaoAtividades: this.obterDistribuicaoAtividades(dataInicio, dataFim),
            evolucaoMensal: this.obterEvolucaoMensal(dataInicio, dataFim),
            estatisticasCriadouros: this.obterEstatisticasCriadouros(dataInicio, dataFim)
        }).pipe(
            map(result => result as Relatorio)
        );
    }
}