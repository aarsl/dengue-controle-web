import { Component, OnInit, ViewChild, ChangeDetectorRef, signal } from '@angular/core';
import { GoogleMap } from '@angular/google-maps';
import { Router } from '@angular/router';
import { GoogleMapsLoaderService } from '../../core/services/google.maps.loader.service';
import { LocalVistoriaService } from '../../core/services/local.vistoria.service';
import { createCustomInfoWindowClass, createInfoWindowContent, createLoadingInfoWindowContent } from './infowindow';
import { LocalMapaDTO } from '../../core/dtos/local-mapa-dto';
import { AtividadeDTO } from '../../core/dtos/atividade-dto';
import { AtividadeService } from '../../core/services/atividade.service copy';

interface MarkerData {
	position: {
		lat: number;
		lng: number;
	};
	options: any;
	local: LocalMapaDTO;
}

@Component({
	selector: 'app-mapa',
	templateUrl: './mapa.component.html',
	styleUrls: ['./mapa.component.scss'],
	standalone: false
})
export class MapaComponent implements OnInit {
	
	@ViewChild(GoogleMap) map!: GoogleMap;

	googleMapsLoaded = false;

	center: any = {
		lat: -23.793921186400585,
		lng: -46.02496275429459
	};

	options: any = {};
	zoom = 15;

	markers = signal<MarkerData[]>([]);
	locais: LocalMapaDTO[] = [];
	locaisFiltrados: LocalMapaDTO[] = [];

	private atividadesCache: Map<number, AtividadeDTO> = new Map();

	painelAberto = false;
	legendaAberta = false;
	
	private currentInfoWindow: any = null;
	private CustomInfoWindow: any = null;

	filtroAtividade = '';
	filtroCriadouro = '';
	filtroEdificacao = '';

	carregando = false;

	constructor(
		private googleMapsLoader: GoogleMapsLoaderService,
		private localVistoriaService: LocalVistoriaService,
		private atividadeService: AtividadeService,
		private router: Router,
		private cdr: ChangeDetectorRef) { }

	async ngOnInit(): Promise<void> {
		await this.googleMapsLoader.load();

		this.CustomInfoWindow = createCustomInfoWindowClass();

		this.options = {
			mapTypeId: 'roadmap',
			mapTypeControl: true,
			mapTypeControlOptions: {
				mapTypeIds: ['roadmap', 'satellite']
			}
		};

		this.googleMapsLoaded = true;
		this.cdr.detectChanges();

		setTimeout(() => {
			if (this.map && this.map.googleMap) {
				this.map.googleMap.addListener('click', () => {
					this.fecharInfoWindow();
				});
			}
			
			this.carregarLocaisVistoria();
		}, 100);
	}

	carregarLocaisVistoria(): void {
		this.carregando = true;
		
		this.localVistoriaService.listarLocaisMapa().subscribe({
			next: (locais: LocalMapaDTO[]) => {
				this.locais = locais;
				this.locaisFiltrados = [...locais];
				this.criarMarcadores();
				this.carregando = false;
			},
			error: (erro) => {
				console.error('Erro ao carregar locais:', erro);
				this.carregando = false;
			}
		});
	}

	criarMarcadores(): void {
		const novosMarkers = this.locaisFiltrados
			.filter(local => local.latitude && local.longitude)
			.map(local => {
				const position = {
					lat: parseFloat(local.latitude.toString()),
					lng: parseFloat(local.longitude.toString())
				};

				return {
					position,
					options: {
						icon: {
							path: (window as any).google.maps.SymbolPath.CIRCLE,
							fillColor: this.getCorMarcador(local),
							fillOpacity: 0.9,
							strokeColor: '#ffffff',
							strokeWeight: 2,
							scale: 10
						}
					},
					local: local
				};
			});

		console.log('Marcadores criados:', novosMarkers);
		this.markers.set(novosMarkers);
	}

	getCorMarcador(local: LocalMapaDTO): string {
		if (local.possuiLarvas === 'Sim') return '#dc3545';
		if (local.possuiCriadouro === 'Sim') return '#ffee00';
		if (local.tipoAtividade === 'Recusa') return '#ff8c00';
		if (local.tipoAtividade === 'Ausente') return '#075cff';
		if (local.tipoAtividade === 'Vazio') return '#cdcdcd';
		return '#28a745';
	}

	abrirInfoWindow(marker: MarkerData): void {
		// Fechar InfoWindow anterior se existir
		if (this.currentInfoWindow) {
			this.currentInfoWindow.close();
		}

		// Centralizar mapa no marcador
		this.map.panTo(marker.position);

		// Mostrar InfoWindow de carregamento
		setTimeout(() => {
			const google = (window as any).google;
			const position = new google.maps.LatLng(marker.position.lat, marker.position.lng);
			const loadingContent = createLoadingInfoWindowContent();
			
			this.currentInfoWindow = new this.CustomInfoWindow(position, loadingContent);
			this.currentInfoWindow.setMap(this.map.googleMap!);

			// Buscar a atividade
			this.carregarAtividade(marker);
		}, 250);
	}

	carregarAtividade(marker: MarkerData): void {
		if (this.atividadesCache.has(marker.local.ultimaAtividadeId)) {
			this.exibirInfoWindowComDados(marker, this.atividadesCache.get(marker.local.ultimaAtividadeId)!);
			return;
		}

		this.atividadeService.buscarPorId(marker.local.ultimaAtividadeId).subscribe({
			next: (atividade: AtividadeDTO) => {
				this.atividadesCache.set(marker.local.ultimaAtividadeId, atividade);
				this.exibirInfoWindowComDados(marker, atividade);
			},
			error: (erro: any) => {
				console.error('Erro ao carregar atividade:', erro);
				this.exibirInfoWindowErro(marker);
			}
		});
	}

	exibirInfoWindowComDados(marker: MarkerData, atividade: AtividadeDTO): void {
		if (!this.currentInfoWindow) return;

		const google = (window as any).google;
		const position = new google.maps.LatLng(marker.position.lat, marker.position.lng);
		const content = createInfoWindowContent(atividade, this.formatarData.bind(this));
		
		this.currentInfoWindow.close();
		
		this.currentInfoWindow = new this.CustomInfoWindow(position, content);
		this.currentInfoWindow.setMap(this.map.googleMap!);

		setTimeout(() => {
			const closeBtn = document.querySelector('.infowindow-close-btn');
			const viewBtn = document.querySelector('.infowindow-view-btn');
			
			if (closeBtn) {
				closeBtn.addEventListener('click', () => {
					this.fecharInfoWindow();
				});
			}

			if (viewBtn) {
				viewBtn.addEventListener('click', () => {
					this.visualizarDetalhes(atividade.localVistoria?.id);
				});
			}
		}, 100);
	}

	exibirInfoWindowErro(marker: MarkerData): void {
		if (!this.currentInfoWindow) return;

		const google = (window as any).google;
		const position = new google.maps.LatLng(marker.position.lat, marker.position.lng);
		const content = `
			<div class="infowindow-header">
				<div class="infowindow-title">
					<i class="fas fa-exclamation-triangle"></i>
					<span>Erro ao carregar dados</span>
				</div>
				<div class="infowindow-actions">
					<button class="infowindow-btn infowindow-close-btn" title="Fechar">
						<i class="fas fa-times"></i>
					</button>
				</div>
			</div>
			<div class="infowindow-content">
				<p>Não foi possível carregar as informações da atividade.</p>
			</div>
		`;
		
		this.currentInfoWindow.close();
		this.currentInfoWindow = new this.CustomInfoWindow(position, content);
		this.currentInfoWindow.setMap(this.map.googleMap!);

		setTimeout(() => {
			const closeBtn = document.querySelector('.infowindow-close-btn');
			if (closeBtn) {
				closeBtn.addEventListener('click', () => {
					this.fecharInfoWindow();
				});
			}
		}, 100);
	}

	fecharInfoWindow(): void {
		if (this.currentInfoWindow) {
			this.currentInfoWindow.close();
			this.currentInfoWindow = null;
		}
	}

	visualizarDetalhes(id: any): void {
		this.router.navigate(['/visualizacao', id]);
	}

	togglePainel(): void {
		this.painelAberto = !this.painelAberto;
	}

	toggleLegenda(): void {
		this.legendaAberta = !this.legendaAberta;
	}

	filtrarMarcadores(): void {
		this.locaisFiltrados = this.locais.filter(local => {
			let mostrar = true;

			if (this.filtroAtividade && local.tipoAtividade !== this.filtroAtividade) {
				mostrar = false;
			}

			if (this.filtroEdificacao) {
				const atividade = this.atividadesCache.get(local.ultimaAtividadeId);
				if (atividade && atividade.localVistoria?.edificacao !== this.filtroEdificacao) {
					mostrar = false;
				} else if (!atividade) {
					mostrar = true;
				}
			}

			if (this.filtroCriadouro) {
				if (this.filtroCriadouro === 'SEM') {
					mostrar = !local.possuiCriadouro || local.possuiCriadouro !== 'Sim';
				} else if (this.filtroCriadouro === 'COM') {
					mostrar = local.possuiCriadouro === 'Sim' && local.possuiLarvas !== 'Sim';
				} else if (this.filtroCriadouro === 'LARVAS') {
					mostrar = local.possuiLarvas === 'Sim';
				}
			}

			return mostrar;
		});

		this.criarMarcadores();
		
		this.fecharInfoWindow();
	}

	formatarData(data: string): string {
		if (!data) return '';

		if (data.includes('/')) return data;
		
		const d = new Date(data + 'T00:00:00');
		return d.toLocaleDateString('pt-BR');
	}
}