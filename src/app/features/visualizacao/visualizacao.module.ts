import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { VisualizacaoComponent } from './visualizacao.component';
import { SharedModule } from '../../shared/shared.module';

const routes: Routes = [
  { path: '', component: VisualizacaoComponent }
];

@NgModule({
  declarations: [VisualizacaoComponent],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class VisualizacaoModule { }