import { Component, Input, forwardRef, OnInit, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { ToastService } from '../../../../core/services/toast.service';
import { CriadourosForm } from '../../../../core/dtos/criadouros-form';

@Component({
    selector: 'app-form-criadouros',
    templateUrl: './form-criadouros.component.html',
    styleUrls: ['./form-criadouros.component.scss'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => FormCriadourosComponent),
        multi: true
    }],
    standalone: false
})
export class FormCriadourosComponent implements OnInit, ControlValueAccessor  {

    @Input() disabled: boolean = false;

    mostrarCriadouros = signal(false);
    mostrarLocaisLarvas = signal(false);
    locaisLarvasDisponiveis = signal<string[]>([]);

    formulario!: FormGroup;

    tiposCriadouros = [
        'Bromélia', 'Ravenala', 'Helicônia', 'Vaso de planta',
        'Pratinho de vaso', 'Fonte', 'Espelho d\'água', 'Piscinas',
        'Material inservível', 'Entulho', 'Balde', 'Pneu',
        'Lata/recipiente', 'Suporte de guarda-de-sol', 'Ralo',
        'Vaso sanitário', 'Lona', 'Caixa d\'água',
        'Brinquedo/Playground', 'Comedouro de animais', 'Calha'
    ];

    private outrosConfirmadosIndices: Set<number> = new Set();

    private onChange: (value: CriadourosForm) => void = () => { };
    private onTouched: () => void = () => { };

    constructor(
        private fb: FormBuilder,
        private toast: ToastService
    ) {
        this.criarFormulario();
    }

    ngOnInit(): void {
        this.configurarObservadores();
    }

    private criarFormulario(): void {
        this.formulario = this.fb.group({
            criadouro: ['Não'],
            tiposCriadouros: [[]],
            outrosCriadouros: this.fb.array([]),
            larvas: ['Não'],
            locaisLarvas: [[]]
        });
    }

    private configurarObservadores(): void {
        this.formulario.valueChanges.subscribe(value => {
            this.emitirValor();
        });

        this.formulario.get('criadouro')?.valueChanges.subscribe(valor => {
            this.mostrarCriadouros.set(valor === 'Sim');
            
            if (!this.mostrarCriadouros()) {
                this.formulario.patchValue({
                    tiposCriadouros: [],
                    larvas: 'Não',
                    locaisLarvas: []
                });
                this.outrosCriadouros.clear();
                this.locaisLarvasDisponiveis.set([]);
            }
        });

        this.formulario.get('larvas')?.valueChanges.subscribe(valor => {
            this.mostrarLocaisLarvas.set(valor === 'Sim');
            
            if (!this.mostrarLocaisLarvas()) {
                this.formulario.patchValue({ locaisLarvas: [] });
            }
        });
    }

    writeValue(value: CriadourosForm | null): void {
        if (!value) {
            return;
        }

        this.mostrarCriadouros.set(value.criadouro === 'Sim');
        this.mostrarLocaisLarvas.set(value.larvas === 'Sim');

        this.outrosCriadouros.clear();
        this.outrosConfirmadosIndices.clear();

        if (value.outrosCriadouros && value.outrosCriadouros.length > 0) {
            value.outrosCriadouros.forEach((outro, index) => {
                const control = this.fb.control(outro);
                control.disable({ emitEvent: false });
                this.outrosCriadouros.push(control);
                this.outrosConfirmadosIndices.add(index);
            });
        }

        this.formulario.patchValue({
            criadouro: value.criadouro || 'Não',
            tiposCriadouros: value.tiposCriadouros || [],
            larvas: value.larvas || 'Não',
            locaisLarvas: value.locaisLarvas || []
        }, { emitEvent: false });

        if (this.mostrarLocaisLarvas()) {
            this.atualizarLocalLarvas();
        }
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
        
        if (isDisabled) {
            this.formulario.disable({ emitEvent: false });
        } else {
            this.formulario.enable({ emitEvent: false });
            
            this.outrosCriadouros.controls.forEach((control, index) => {
                if (this.outrosConfirmadosIndices.has(index)) {
                    control.disable({ emitEvent: false });
                }
            });
        }
    }

    private emitirValor(): void {
        const outrosConfirmados = this.outrosCriadouros.controls
            .filter(ctrl => ctrl.disabled && ctrl.value?.trim())
            .map(ctrl => ctrl.value.trim());

        const valor: CriadourosForm = {
            criadouro: this.formulario.get('criadouro')?.value,
            tiposCriadouros: this.formulario.get('tiposCriadouros')?.value,
            outrosCriadouros: outrosConfirmados,
            larvas: this.formulario.get('larvas')?.value,
            locaisLarvas: this.formulario.get('locaisLarvas')?.value
        };

        this.onChange(valor);
    }

    toggleCriadouros(): void {
        const value = this.formulario.get('criadouro')?.value;
        this.mostrarCriadouros.set(value === 'Sim');

        if (!this.mostrarCriadouros()) {
            this.formulario.patchValue({
                tiposCriadouros: [],
                larvas: 'Não',
                locaisLarvas: []
            });
            this.outrosCriadouros.clear();
            this.locaisLarvasDisponiveis.set([]);
        }
    }

    onSelectCriadouro(item: string, event: any): void {
        const selecionados = this.formulario.get('tiposCriadouros')?.value as string[];

        if (event.target.checked) {
            selecionados.push(item);
        } else {
            const idx = selecionados.indexOf(item);
            if (idx >= 0) selecionados.splice(idx, 1);
        }

        this.formulario.patchValue({ tiposCriadouros: [...selecionados] });
        this.atualizarLocalLarvas();
    }

    adicionarOutroCriadouro(): void {
        if (this.outrosCriadouros.length >= 5) {
            this.toast.warn("Você pode adicionar no máximo 5 outros criadouros.");
            return;
        }

        this.outrosCriadouros.push(this.fb.control(''));

        if (this.formulario.get('larvas')?.value === 'Sim') {
            this.atualizarLocalLarvas();
        }
    }

    removerOutroCriadouro(index: number): void {
        const control = this.outrosCriadouros.at(index);
        const estaConfirmado = control.disabled;
        const valorRemovido = control.value?.trim();

        this.outrosCriadouros.removeAt(index);
        
        // Atualizar os índices confirmados (remover o índice e ajustar os posteriores)
        const novosIndices = new Set<number>();
        this.outrosConfirmadosIndices.forEach(i => {
            if (i < index) {
                novosIndices.add(i);
            } else if (i > index) {
                novosIndices.add(i - 1);
            }
        });
        this.outrosConfirmadosIndices = novosIndices;

        if (estaConfirmado && valorRemovido) {
            const locaisLarvasAtuais = this.formulario.get('locaisLarvas')?.value || [];
            const novosLocais = locaisLarvasAtuais.filter((local: string) => local !== valorRemovido);
            
            this.formulario.patchValue({ 
                locaisLarvas: novosLocais 
            });
        }

        if (this.formulario.get('larvas')?.value === 'Sim') {
            this.atualizarLocalLarvas();
        }
    }

    confirmarOutroCriadouro(index: number): void {
        const control = this.outrosCriadouros.at(index);
        const valor = control.value?.trim();

        if (!valor) {
            this.toast.warn('Digite uma descrição para o criadouro.');
            return;
        }

        const normalizar = (texto: string): string => {
            return texto
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '');
        };

        const valorNormalizado = normalizar(valor);

        const existeNaListaPadrao = this.tiposCriadouros.some(tipo =>
            normalizar(tipo) === valorNormalizado
        );

        if (existeNaListaPadrao) {
            this.toast.warn('Este criadouro já existe na lista');
            return;
        }

        const existeEmOutros = this.outrosCriadouros.controls.some((ctrl, i) =>
            i !== index && ctrl.disabled && normalizar(ctrl.value?.trim() || '') === valorNormalizado
        );

        if (existeEmOutros) {
            this.toast.warn('Este criadouro já foi adicionado');
            return;
        }

        control.disable();
        this.outrosConfirmadosIndices.add(index);

        if (this.formulario.get('larvas')?.value === 'Sim') {
            this.atualizarLocalLarvas();
        }
    }

    toggleLarvas(): void {
        const larvasValue = this.formulario.get('larvas')?.value;
        const criadourosSelecionados = this.formulario.get('tiposCriadouros')?.value || [];

        const outrosConfirmados = this.outrosCriadouros.controls.filter(ctrl =>
            ctrl.value?.trim() && ctrl.disabled
        ).length;

        const possuiCriadouro = criadourosSelecionados.length > 0 || outrosConfirmados > 0;

        if (larvasValue === 'Sim') {
            if (!possuiCriadouro) {
                this.toast.warn('Necessário selecionar pelo menos um criadouro');
                this.formulario.patchValue({ larvas: 'Não' });
                this.mostrarLocaisLarvas.set(false);
                return;
            }
            this.mostrarLocaisLarvas.set(true);
            this.atualizarLocalLarvas();
        } else {
            this.mostrarLocaisLarvas.set(false);
            this.formulario.patchValue({ locaisLarvas: [] });
        }
    }

    atualizarLocalLarvas(): void {
        const selecoesAnteriores = this.formulario.get('locaisLarvas')?.value || [];

        const novosLocais: string[] = [];

        const tiposSelecionados = this.formulario.get('tiposCriadouros')?.value || [];
        novosLocais.push(...tiposSelecionados);

        this.outrosCriadouros.controls.forEach(ctrl => {
            if (ctrl.disabled) {
                const valor = ctrl.value?.trim();
                if (valor) {
                    novosLocais.push(valor);
                }
            }
        });

        // Atualiza o signal
        this.locaisLarvasDisponiveis.set(novosLocais);

        const selecoesValidas = selecoesAnteriores.filter((selecao: string) =>
            novosLocais.includes(selecao)
        );

        this.formulario.patchValue({
            locaisLarvas: selecoesValidas
        });
    }

    onChangeLocalLarva(valor: string, event: any): void {
        const selecionadas = this.formulario.get('locaisLarvas')?.value as string[];

        if (event.target.checked) {
            if (!selecionadas.includes(valor)) {
                selecionadas.push(valor);
            }
        } else {
            const index = selecionadas.indexOf(valor);
            if (index >= 0) {
                selecionadas.splice(index, 1);
            }
        }

        this.formulario.patchValue({
            locaisLarvas: [...selecionadas]
        });
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    get outrosCriadouros(): FormArray {
        return this.formulario.get('outrosCriadouros') as FormArray;
    }

    get podeEditar(): boolean {
        return !this.disabled;
    }
}