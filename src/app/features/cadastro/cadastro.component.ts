import { Component, ElementRef, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GeolocationService } from '../../core/services/geolocation.service';
import { LocalVistoria } from '../../core/models/local.vistoria';
import { ToastService } from '../../core/services/toast.service';
import { Atividade} from '../../core/models/atividade';
import { CriadourosForm, criadourosFormDataToAtividade } from '../../core/dtos/criadouros-form';
import { CadastroDTO } from '../../core/dtos/cadastro-dto';
import { Router } from '@angular/router';
import { AtividadeService } from '../../core/services/atividade.service';

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
    submitted = false;

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
        private router: Router,
        private el: ElementRef) { }

    ngOnInit(): void {
        this.formulario = this.criarFormulario();
        this.setDataAtual();
        this.configurarValidacaoCondicional();
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
			responsavel: [''],
			funcao: [''],
			criadourosData: [null],
			acoesRealizadas: [[]],
			observacao: [''],
			dataRetorno: [''],
			motivoRetorno: ['']
		});
	}

    private configurarValidacaoCondicional(): void {
        this.formulario.get('tipoAtividade')?.valueChanges.subscribe(tipo => {
            this.atualizarValidacaoResponsavel(tipo);
        });
    }

    private atualizarValidacaoResponsavel(tipoAtividade: string): void {
        const responsavelControl = this.formulario.get('responsavel');
        const funcaoControl = this.formulario.get('funcao');

        const tiposComResponsavel = ['Vistoria', 'Recusa', 'Retorno'];

        if (tiposComResponsavel.includes(tipoAtividade)) {
            responsavelControl?.setValidators([Validators.required]);
            funcaoControl?.setValidators([Validators.required]);
        } else {
            responsavelControl?.clearValidators();
            funcaoControl?.clearValidators();
            responsavelControl?.setValue(null);
            funcaoControl?.setValue(null);
        }

        responsavelControl?.updateValueAndValidity();
        funcaoControl?.updateValueAndValidity();
    }

    exibirCamposResponsavel(): boolean {
        const tipoAtividade = this.formulario.get('tipoAtividade')?.value;
        return ['Vistoria', 'Recusa', 'Retorno'].includes(tipoAtividade);
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

    isCampoInvalido(campo: string): boolean {
        const control = this.formulario.get(campo);
        return this.submitted && control ? (control.invalid && control.enabled) : false;
    }

	salvar(): void {
		this.submitted = true;

		if (this.formulario.invalid) {
			this.toast.error("Preencha todos os campos obrigatórios.");
			this.focarPrimeiroCampoInvalido();
			return;
		}

		const formValue = this.formulario.getRawValue();

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

		this.atividadeService.incluir(cadastroDTO).subscribe({
            next: (localVistoriaId) => {
                this.toast.info('Cadastro realizado com sucesso');
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
        this.submitted = false;
        this.setDataAtual();
        this.formulario.patchValue({ 
            acoesRealizadas: [],
            criadourosData: null
        });
    }

    private setDataAtual(): void {        
        this.formulario.patchValue({ dataAtividade: this.dataAtual });
    }

    get dataAtual(): string {
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, '0');
        const dia = String(hoje.getDate()).padStart(2, '0');
        return `${ano}-${mes}-${dia}`;
    }

    private focarPrimeiroCampoInvalido(): void {
        setTimeout(() => {
            const primeiroCampoInvalido = this.el.nativeElement.querySelector('.campo-invalido');
            if (primeiroCampoInvalido) {
                primeiroCampoInvalido.focus();
                primeiroCampoInvalido.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    }
}