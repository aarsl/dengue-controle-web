import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';

export interface Coordenadas {
  latitude: number;
  longitude: number;
}

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {
  obterLocalizacao(): Observable<Coordenadas> {
    return new Observable((observer: Observer<Coordenadas>) => {
      if (!navigator.geolocation) {
        observer.error('Geolocalização não suportada');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          observer.next({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          observer.complete();
        },
        (error) => {
          observer.error(error.message);
        }
      );
    });
  }
}