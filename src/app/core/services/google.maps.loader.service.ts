import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class GoogleMapsLoaderService {
  private loading = false;
  private loaded = false;

  load(): Promise<void> {
    return new Promise((resolve) => {
      if (this.loaded) {
        resolve();
        return;
      }

      if (this.loading) {
        const checkInterval = setInterval(() => {
          if (this.loaded) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 50);
        return;
      }

      this.loading = true;

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyAmPrmafVrpKqt5_epuvG6Ocr0T66aHZgc&libraries=places&language=pt-BR`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        this.loaded = true;
        resolve();
      };

      document.head.appendChild(script);
    });
  }
}
