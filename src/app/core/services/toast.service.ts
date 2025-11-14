import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type ToastType = 'info' | 'warn' | 'error';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toastSubject = new Subject<{ message: string; type: ToastType }>();
  toast$ = this.toastSubject.asObservable();

  info(message: string) {
    this.toastSubject.next({ message, type: 'info' });
  }

  warn(message: string) {
    this.toastSubject.next({ message, type: 'warn' });
  }

  error(message: string) {
    this.toastSubject.next({ message, type: 'error' });
  }
}
