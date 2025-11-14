import { AtividadeDTO } from "../../core/dtos/atividade-dto";


export function createCustomInfoWindowClass() {
	const google = (window as any).google;
	
	return class CustomInfoWindow extends google.maps.OverlayView {
		private position: any;
		private content: string;
		private div: HTMLElement | null = null;

		constructor(position: any, content: string) {
			super();
			this.position = position;
			this.content = content;
		}

		onAdd(): void {
			const div = document.createElement('div');
			div.className = 'custom-infowindow';
			div.innerHTML = this.content;
			this.div = div;

			const panes = this['getPanes']();
			if (panes) {
				panes.floatPane.appendChild(div);
			}

			this.draw();
		}

		draw(): void {
			const overlayProjection = this['getProjection']();
			const position = overlayProjection.fromLatLngToDivPixel(this.position);

			if (this.div && this.div.offsetWidth > 0 && position) {
				this.div.style.left = (position.x - this.div.offsetWidth / 2) + 'px';
				this.div.style.top = (position.y - this.div.offsetHeight - 20) + 'px';
				this.div.style.position = 'absolute';
			}
		}

		onRemove(): void {
			if (this.div && this.div.parentNode) {
				this.div.parentNode.removeChild(this.div);
				this.div = null;
			}
		}

		close(): void {
			this['setMap'](null);
		}
	};
}

export function createLoadingInfoWindowContent(): string {
	return `
		<div class="infowindow-header">
			<div class="infowindow-title">
				<i class="fas fa-spinner fa-spin"></i>
				<span>Carregando...</span>
			</div>
		</div>
		<div class="infowindow-content">
			<p>Buscando informações do local...</p>
		</div>
	`;
}

export function createInfoWindowContent(atividade: AtividadeDTO, formatarDataFn: (data: string) => string): string {
	const localVistoria = atividade.localVistoria;
	
	if (!localVistoria) {
		return `
			<div class="infowindow-header">
				<div class="infowindow-title">
					<i class="fas fa-exclamation-triangle"></i>
					<span>Local não encontrado</span>
				</div>
				<div class="infowindow-actions">
					<button class="infowindow-btn infowindow-close-btn" title="Fechar">
						<i class="fas fa-times"></i>
					</button>
				</div>
			</div>
		`;
	}

	const criadouroColor = atividade.criadouro === 'Sim' ? '#dc3545' : '#28a745';

	const tiposCriadourosTexto = atividade.tiposCriadouros && atividade.tiposCriadouros.length > 0
		? atividade.tiposCriadouros.join(', ')
		: '';
	
	const outrosCriadourosTexto = atividade.outrosCriadouros && atividade.outrosCriadouros.length > 0
		? atividade.outrosCriadouros.join(', ')
		: '';

	const locaisLarvasTexto = atividade.locaisLarvas && atividade.locaisLarvas.length > 0
		? atividade.locaisLarvas.join(', ')
		: '';

	return `
		<div class="infowindow-header">
			<div class="infowindow-title">
				<i class="fas fa-home"></i>
				<span>${localVistoria.logradouro || 'N/A'}, ${localVistoria.numero || 'S/N'}</span>
			</div>
			<div class="infowindow-actions">
				<button class="infowindow-btn infowindow-view-btn" title="Ver detalhes">
					<i class="fas fa-arrow-up-right-from-square"></i>
				</button>
				<button class="infowindow-btn infowindow-close-btn" title="Fechar">
					<i class="fas fa-times"></i>
				</button>
			</div>
		</div>
		<div class="infowindow-content">
			<p><strong>Módulo/Quadra/Lote:</strong> ${localVistoria.modulo || 'N/A'}/${localVistoria.quadra || 'N/A'}/${localVistoria.lote || 'N/A'}</p>
			${localVistoria.condominio ? `<p><strong>Condomínio:</strong> ${localVistoria.condominio}</p>` : ''}
			<p><strong>Última Atividade:</strong> <span>${atividade.tipoAtividade || 'N/A'}</span></p>
			<p><strong>Data Atividade:</strong> ${formatarDataFn(atividade.dataAtividade as any)}</p>			
			<p><strong>Criadouro:</strong> <span style="color: ${criadouroColor}">${atividade.criadouro || 'Não verificado'}</span></p>
			${tiposCriadourosTexto ? `<p><strong>Tipos de Criadouro:</strong> ${tiposCriadourosTexto} ${outrosCriadourosTexto ? `, ${outrosCriadourosTexto}` : ''}</p>` : ''}
			${atividade.larvas === 'Sim' ? `<p style="color: #dc3545; font-weight: bold;"><i class="fas fa-exclamation-triangle"></i> Larvas encontradas!</p>` : ''}
			${locaisLarvasTexto ? `<p><strong>Locais das Larvas:</strong> ${locaisLarvasTexto}</p>` : ''}
			${atividade.dataRetorno ? `<p><strong>Data de Retorno:</strong> ${formatarDataFn(atividade.dataRetorno as any)}</p>` : ''}
			${atividade.motivoRetorno ? `<p><strong>Motivo do Retorno:</strong> ${atividade.motivoRetorno}</p>` : ''}
		</div>
	`;
}