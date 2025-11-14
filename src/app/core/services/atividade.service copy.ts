import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { LocalVistoria } from '../models/local.vistoria';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { CadastroDTO } from '../dtos/cadastro-dto';
import { PageListagemDTO } from '../dtos/page-listagem-dto';
import { AtividadeDTO } from '../dtos/atividade-dto';

@Injectable({
    providedIn: 'root'
})
export class AtividadeService {

    constructor(private http: HttpClient) { }

    listar(page = 0, size = 10, sort = 'dataCadastro', direction = 'DESC'): Observable<PageListagemDTO> {
        const params = {
            page: page,
            size: size,
            sort: sort,
            direction: direction
        }
        return this.http.get<PageListagemDTO>(`${environment.apiUrl}/atividades`, { params: params });
    }

    buscarPorId(id: number): Observable<AtividadeDTO> {
		return this.http.get<AtividadeDTO>(`${environment.apiUrl}/atividades/${id}`);
	}

    salvar(cadastroDTO: CadastroDTO): Observable<LocalVistoria> {
        const url = `${environment.apiUrl}/atividades`;
        return this.http.post<LocalVistoria>(url, cadastroDTO);
    }
}