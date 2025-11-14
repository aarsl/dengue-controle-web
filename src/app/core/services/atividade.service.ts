import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { LocalVistoria } from '../models/local.vistoria';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { CadastroDTO } from '../dtos/cadastro-dto';
import { PageListagemDTO } from '../dtos/page-listagem-dto';
import { AtividadeDTO } from '../dtos/atividade-dto';
import { FiltrosAtividade } from '../../features/lista/filtros-modal/filtros-modal.component';

@Injectable({
    providedIn: 'root'
})
export class AtividadeService {

    constructor(private http: HttpClient) { }

    listar(page = 0, size = 10, sort = 'dataCadastro', direction = 'DESC', filtros?: FiltrosAtividade): Observable<PageListagemDTO> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString())
            .set('sort', sort)
            .set('direction', direction);

        return this.http.post<PageListagemDTO>(`${environment.apiUrl}/atividades/filtrar`, filtros, { params });
    }

    buscarPorId(id: number): Observable<AtividadeDTO> {
		return this.http.get<AtividadeDTO>(`${environment.apiUrl}/atividades/${id}`);
	}

   excel(filtros?: FiltrosAtividade) {
        return this.http.post(`${environment.apiUrl}/atividades/excel`, filtros || {}, { 
            responseType: 'blob', 
            observe: 'response'
        });
    }

    incluir(cadastroDTO: CadastroDTO): Observable<LocalVistoria> {
        const url = `${environment.apiUrl}/atividades`;
        return this.http.post<LocalVistoria>(url, cadastroDTO);
    }

    atualizar(id: any, atividadeDTO: any) {
		return this.http.put<any>(`${environment.apiUrl}/atividades/${id}`, atividadeDTO);
	}
}