import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ListaComponent } from './lista.component';

const routes: Routes = [
  { path: '', component: ListaComponent }
];

@NgModule({
  declarations: [ListaComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class ListaModule { }