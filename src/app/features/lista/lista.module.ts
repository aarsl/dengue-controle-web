import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ListaComponent } from './lista.component';
import { FormsModule } from '@angular/forms';
import { FiltrosModalComponent } from './filtros-modal/filtros-modal.component';

const routes: Routes = [
	{ path: '', component: ListaComponent }
];

@NgModule({
	declarations: [ListaComponent, FiltrosModalComponent],
	imports: [
		CommonModule,
		FormsModule,
		RouterModule.forChild(routes)
	]
})
export class ListaModule { }