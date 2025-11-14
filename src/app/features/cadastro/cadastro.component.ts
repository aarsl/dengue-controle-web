import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { GeolocationService } from '../../core/services/geolocation.service';
import { LocalVistoria } from '../../core/models/local.vistoria';
import { ToastService } from '../../core/services/toast.service';
import { Atividade} from '../../core/models/atividade';
import { CriadourosForm, criadourosFormDataToAtividade } from '../../core/dtos/criadouros-form';
import { CadastroDTO } from '../../core/dtos/cadastro-dto';
import { Router } from '@angular/router';
import { AtividadeService } from '../../core/services/atividade.service copy';

@Component({
    selector: 'app-cadastro',
    templateUrl: './cadastro.component.html',
    styleUrls: ['./cadastro.component.scss'],
    standalone: false
})
export class CadastroComponent implements OnInit {

    formulario!: FormGroup;
    loadingCoordenadas = false;
    erroCoordenadas = '';

    tiposAcoes = [
        'Coleta realizada',
        'Adesivo aplicado',
        'Aviso deixado',
        'Orientações ao responsável'
    ];

    constructor(
        private fb: FormBuilder,
        private atividadeService: AtividadeService,
        private geolocationService: GeolocationService,
        private toast: ToastService,
        private router: Router) { }

    ngOnInit(): void {
        this.formulario = this.criarFormulario();
        this.setDataAtual();
    }

    private criarFormulario(): FormGroup {
		return this.fb.group({
			modulo: ['', Validators.required],
			quadra: ['', Validators.required],
			lote: ['', Validators.required],
			logradouro: ['', Validators.required],
			numero: ['', Validators.required],
			condominio: [''],
			edificacao: ['', Validators.required],
			latitude: ['', Validators.required],
			longitude: ['', Validators.required],			
			dataAtividade: ['', Validators.required],
			tipoAtividade: ['', Validators.required],
			agente: ['', Validators.required],
			agenteAcomp1: [''],
			agenteAcomp2: [''],
			responsavel: ['', Validators.required],
			funcao: ['', Validators.required],
			criadourosData: [null],
			acoesRealizadas: [[]],
			observacao: [''],
			dataRetorno: [''],
			motivoRetorno: ['']
		});
	}

    private setDataAtual(): void {
        const hoje = new Date().toISOString().split('T')[0];
        this.formulario.patchValue({ dataAtividade: hoje });
    }

    obterLocalizacao(): void {
        this.loadingCoordenadas = true;
        this.erroCoordenadas = '';

        this.geolocationService.obterLocalizacao().subscribe({
            next: (coords) => {
                this.formulario.patchValue({
                    latitude: coords.latitude.toFixed(6),
                    longitude: coords.longitude.toFixed(6)
                });
                this.loadingCoordenadas = false;
            },
            error: (erro) => {
                this.erroCoordenadas = `Erro: ${erro}`;
                this.loadingCoordenadas = false;
            }
        });
    }

    onSelectAcao(acao: string, event: any): void {
        const selecionadas = (this.formulario.get('acoesRealizadas')?.value || []) as string[];
        if (event.target.checked) {
            selecionadas.push(acao);
        } else {
            const idx = selecionadas.indexOf(acao);
            if (idx >= 0) selecionadas.splice(idx, 1);
        }
        this.formulario.patchValue({ acoesRealizadas: [...selecionadas] });
    }

	salvar(): void {
		console.log(this.formulario.value.dataAtividade);
		if (this.formulario.invalid) {
			this.toast.error("Preencha todos os campos obrigatórios.");
			return;
		}

		const formValue = this.formulario.value;

		const local: LocalVistoria = {
			modulo: formValue.modulo,
			quadra: formValue.quadra,
			lote: formValue.lote,
			logradouro: formValue.logradouro,
			numero: formValue.numero,
			condominio: formValue.condominio,
			edificacao: formValue.edificacao,
			latitude: formValue.latitude,
			longitude: formValue.longitude,
		};

		const criadourosData: CriadourosForm = formValue.criadourosData || {
			criadouro: 'Não',
			tiposCriadouros: [],
			outrosCriadouros: [],
			larvas: 'Não',
			locaisLarvas: []
		};

		const atividade: Atividade = {
			dataAtividade: formValue.dataAtividade,
			tipoAtividade: formValue.tipoAtividade,
			agente: formValue.agente,
			agenteAcomp1: formValue.agenteAcomp1,
			agenteAcomp2: formValue.agenteAcomp2,
			responsavel: formValue.responsavel,
			funcao: formValue.funcao,
			...criadourosFormDataToAtividade(criadourosData),
			acoesRealizadas: formValue.acoesRealizadas,
			observacao: formValue.observacao,
			dataRetorno: formValue.dataRetorno,
			motivoRetorno: formValue.motivoRetorno
		};

        let cadastroDTO: CadastroDTO = {
            localVistoria: local,
            atividade: atividade
        }

		this.atividadeService.salvar(cadastroDTO).subscribe({
			  next: (localVistoriaId) => {
				this.router.navigate(['/visualizacao', localVistoriaId]);
			},
			error: (errorResponse) => {
				console.error(errorResponse);
				if(errorResponse?.error?.message) {
					this.toast.error(errorResponse?.error?.message);
					return;
				}
				this.toast.error('Ocorrou um erro ao salvar. Entre em contato com o administrador do sistema.');
			}
		});
	}

    limpar(): void {
        this.formulario.reset();
        this.setDataAtual();
        this.formulario.patchValue({ 
            acoesRealizadas: [],
            criadourosData: null
        });
    }
}