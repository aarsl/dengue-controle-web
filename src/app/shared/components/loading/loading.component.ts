import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../../core/services/loading.service';

@Component({
    selector: 'app-loading',
    imports: [CommonModule],
    templateUrl: './loading.component.html',
    styleUrls: ['./loading.component.scss'],
    standalone: true
})
export class LoadingComponent {
    constructor(public loadingService: LoadingService) { }
}