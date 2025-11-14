import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { GoogleMap } from '@angular/google-maps';
import { Router } from '@angular/router';
import { GoogleMapsLoaderService } from '../../core/services/google.maps.loader.service';
import { LocalVistoriaService } from '../../core/services/local.vistoria.service';
import { createCustomInfoWindowClass, createInfoWindowContent, createLoadingInfoWindowContent } from './infowindow';
import { LocalMapaDTO } from '../../core/dtos/local-mapa-dto';
import { AtividadeDTO } from '../../core/dtos/atividade-dto';
import { AtividadeService } from '../../core/services/atividade.service';

interface MarkerData {
	position: {
		lat: number;
		lng: number;
	};
	marker: google.maps.Marker;
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

	private allMarkers: MarkerData[] = [];
	
	locais: LocalMapaDTO[] = [];
	locaisFiltrados: LocalMapaDTO[] = [];

	private atividadesCache: Map<number, AtividadeDTO> = new Map();
	private readonly MAX_CACHE_SIZE = 1000;

	painelAberto = false;
	legendaAberta = false;
	
	private currentInfoWindow: any = null;
	private CustomInfoWindow: any = null;

	filtroAtividade = '';
	filtroCriadouro = '';
	filtroEdificacao = '';

	carregando = false;

	private iconCache: Map<string, any> = new Map();

	constructor(
		private googleMapsLoader: GoogleMapsLoaderService,
		private localVistoriaService: LocalVistoriaService,
		private atividadeService: AtividadeService,
		private router: Router,
		private cdr: ChangeDetectorRef) { }

	async ngOnInit(): Promise<void> {
		await this.googleMapsLoader.load();

		this.CustomInfoWindow = createCustomInfoWindowClass();

		this.criarIconesPNG();

		this.options = {
			mapTypeId: 'roadmap',
			mapTypeControl: true,
			mapTypeControlOptions: {
				mapTypeIds: ['roadmap', 'satellite']
			},
			gestureHandling: 'greedy',
			disableDoubleClickZoom: false,
			mapId: null
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

	criarIconesPNG(): void {
		const cores = {
			'#dc3545': 'larvas',
			'#ffee00': 'criadouro', 
			'#ff8c00': 'recusa',
			'#075cff': 'ausente',
			'#cdcdcd': 'vazio',
			'#28a745': 'vistoria'
		};

		Object.entries(cores).forEach(([cor, tipo]) => {
			const canvas = document.createElement('canvas');
			const size = 25;
			canvas.width = size;
			canvas.height = size;
			
			const ctx = canvas.getContext('2d')!;
			
			ctx.beginPath();
			ctx.arc(size / 2, size / 2, size / 2 - 2, 0, 2 * Math.PI);
			ctx.fillStyle = cor;
			ctx.fill();
			ctx.strokeStyle = '#ffffff';
			ctx.lineWidth = 2;
			ctx.stroke();
			
			const iconUrl = canvas.toDataURL('image/png');
			
			this.iconCache.set(cor, {
				url: iconUrl,
				scaledSize: new google.maps.Size(20, 20),
				anchor: new google.maps.Point(10, 10)
			});
		});
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
		this.allMarkers.forEach(markerData => {
			markerData.marker.setMap(null);
		});
		this.allMarkers = [];

		if (!this.map || !this.map.googleMap) {
			return;
		}

		const google = (window as any).google;
		const novosMarkers: MarkerData[] = [];
		
		for (const local of this.locaisFiltrados) {
			if (!local.latitude || !local.longitude) continue;

			const position = {
				lat: parseFloat(local.latitude.toString()),
				lng: parseFloat(local.longitude.toString())
			};

			const cor = this.getCorMarcador(local);
			const icon = this.iconCache.get(cor);

			const marker = new google.maps.Marker({
				position,
				map: this.map.googleMap,
				icon,
				optimized: true,
				clickable: true
			});

			const markerData: MarkerData = {
				position,
				marker,
				local
			};

			marker.addListener('click', () => {
				this.abrirInfoWindow(markerData);
			});

			novosMarkers.push(markerData);
		}

		this.allMarkers = novosMarkers;
	}

	getCorMarcador(local: LocalMapaDTO): string {
		if (local.possuiLarvas === 'Sim') return '#dc3545';
		if (local.possuiCriadouro === 'Sim') return '#ffee00';
		if (local.tipoAtividade === 'Recusa') return '#ff8c00';
		if (local.tipoAtividade === 'Ausente') return '#075cff';
		if (local.tipoAtividade === 'Lote vazio') return '#cdcdcd';
		return '#28a745';
	}

	abrirInfoWindow(markerData: MarkerData): void {
		if (this.currentInfoWindow) {
			this.currentInfoWindow.close();
		}

		this.map.panTo(markerData.position);

		requestAnimationFrame(() => {
			setTimeout(() => {
				const google = (window as any).google;
				const position = new google.maps.LatLng(markerData.position.lat, markerData.position.lng);
				const loadingContent = createLoadingInfoWindowContent();
				
				this.currentInfoWindow = new this.CustomInfoWindow(position, loadingContent);
				this.currentInfoWindow.setMap(this.map.googleMap!);

				this.carregarAtividade(markerData);
			}, 50);
		});
	}

	carregarAtividade(markerData: MarkerData): void {
		const atividadeId = markerData.local.ultimaAtividadeId;

		if (this.atividadesCache.has(atividadeId)) {
			this.exibirInfoWindowComDados(markerData, this.atividadesCache.get(atividadeId)!);
			return;
		}

		this.atividadeService.buscarPorId(atividadeId).subscribe({
			next: (atividade: AtividadeDTO) => {
				if (this.atividadesCache.size >= this.MAX_CACHE_SIZE) {
					const firstKey = <number> this.atividadesCache.keys().next().value;
					this.atividadesCache.delete(firstKey);
				}
				
				this.atividadesCache.set(atividadeId, atividade);
				this.exibirInfoWindowComDados(markerData, atividade);
			},
			error: (erro: any) => {
				console.error('Erro ao carregar atividade:', erro);
				this.exibirInfoWindowErro(markerData);
			}
		});
	}

	exibirInfoWindowComDados(markerData: MarkerData, atividade: AtividadeDTO): void {
		if (!this.currentInfoWindow) return;

		const google = (window as any).google;
		const position = new google.maps.LatLng(markerData.position.lat, markerData.position.lng);
		const content = createInfoWindowContent(atividade, this.formatarData.bind(this));
		
		this.currentInfoWindow.close();
		
		this.currentInfoWindow = new this.CustomInfoWindow(position, content);
		this.currentInfoWindow.setMap(this.map.googleMap!);

		requestAnimationFrame(() => {
			const closeBtn = document.querySelector('.infowindow-close-btn');
			const viewBtn = document.querySelector('.infowindow-view-btn');
			
			if (closeBtn) {
				closeBtn.addEventListener('click', () => {
					this.fecharInfoWindow();
				}, { once: true });
			}

			if (viewBtn) {
				viewBtn.addEventListener('click', () => {
					this.visualizarDetalhes(atividade.localVistoria?.id);
				}, { once: true });
			}
		});
	}

	exibirInfoWindowErro(markerData: MarkerData): void {
		if (!this.currentInfoWindow) return;

		const google = (window as any).google;
		const position = new google.maps.LatLng(markerData.position.lat, markerData.position.lng);
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

		requestAnimationFrame(() => {
			const closeBtn = document.querySelector('.infowindow-close-btn');
			if (closeBtn) {
				closeBtn.addEventListener('click', () => {
					this.fecharInfoWindow();
				}, { once: true });
			}
		});
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
			if (this.filtroAtividade && local.tipoAtividade !== this.filtroAtividade) {
				return false;
			}

			if (this.filtroCriadouro) {
				if (this.filtroCriadouro === 'SEM' && local.possuiCriadouro === 'Sim') {
					return false;
				}
				if (this.filtroCriadouro === 'COM') {
					if (local.possuiCriadouro !== 'Sim' || local.possuiLarvas === 'Sim') {
						return false;
					}
				}
				if (this.filtroCriadouro === 'LARVAS' && local.possuiLarvas !== 'Sim') {
					return false;
				}
			}

			if (this.filtroEdificacao) {
				const atividade = this.atividadesCache.get(local.ultimaAtividadeId);
				if (atividade) {
					if (atividade.localVistoria?.edificacao !== this.filtroEdificacao) {
						return false;
					}
				}
			}

			return true;
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

	ngOnDestroy(): void {
		this.allMarkers.forEach(markerData => {
			markerData.marker.setMap(null);
		});
		this.allMarkers = [];
		
		if (this.currentInfoWindow) {
			this.currentInfoWindow.close();
		}
		
		this.atividadesCache.clear();
		this.iconCache.clear();
	}
}