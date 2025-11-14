import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ConsultaDTO } from '../dtos/consulta-dto';
import { LocalMapaDTO } from '../dtos/local-mapa-dto';
import { TipoEdificacao } from '../models/local.vistoria';

@Injectable({
    providedIn: 'root'
})
export class LocalVistoriaService {

    constructor(private http: HttpClient) { }

    listarLocaisMapa(): Observable<LocalMapaDTO[]> {
        return this.http.get<LocalMapaDTO[]>(`${environment.apiUrl}/locais-vistoria/mapa`);;
    }

    getById(id: number): Observable<ConsultaDTO> {
        return this.http.get<ConsultaDTO>(`${environment.apiUrl}/locais-vistoria/${id}`);
    }

    atualizar(id: any, localDTO: any) {
		return this.http.put<any>(`${environment.apiUrl}/locais-vistoria/${id}`, localDTO);
	}
}