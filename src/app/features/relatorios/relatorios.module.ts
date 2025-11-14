import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { RelatoriosComponent } from './relatorios.component';

const routes: Routes = [
    { path: '', component: RelatoriosComponent }
];

@NgModule({
    declarations: [RelatoriosComponent],
    imports: [
        CommonModule,
        FormsModule,
        RouterModule.forChild(routes)
    ]
})
export class RelatoriosModule { }