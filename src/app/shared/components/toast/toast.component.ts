import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { ToastService, ToastType } from '../../../core/services/toast.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss'],
  standalone: false
})
export class ToastComponent implements OnInit, OnDestroy {

  message = '';
  type: ToastType | null = null;
  exibir = signal(false);
  
  private subscription?: Subscription;
  private hideTimeout?: any;

  constructor(
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.subscription = this.toastService.toast$.subscribe(toast => {
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
      }

      this.exibir.set(false);

      setTimeout(() => {
        this.message = toast.message;
        this.type = toast.type;
        this.exibir.set(true);

        this.hideTimeout = setTimeout(() => {
          this.exibir.set(false);
        }, 3500);
      }, 50);
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }
  }
}