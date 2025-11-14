import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleMapsModule } from '@angular/google-maps';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { MapaComponent } from './mapa.component';

const routes: Routes = [
  { path: '', component: MapaComponent }
];

@NgModule({
  declarations: [MapaComponent],
  imports: [
    CommonModule,
    GoogleMapsModule,
    FormsModule,
    RouterModule.forChild(routes)
  ]
})
export class MapaModule { }