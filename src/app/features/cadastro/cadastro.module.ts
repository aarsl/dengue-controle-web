import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { CadastroComponent } from './cadastro.component';
import { FormCriadourosComponent } from '../../shared/components/forms/form-criadouros/form-criadouros.component';
import { SharedModule } from '../../shared/shared.module';

const routes: Routes = [
  { path: '', component: CadastroComponent }
];

@NgModule({
  declarations: [CadastroComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class CadastroModule { }