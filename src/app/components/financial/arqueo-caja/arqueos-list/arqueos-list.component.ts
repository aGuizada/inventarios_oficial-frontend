import { Component, Input } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { ArqueoCaja } from '../../../../interfaces';

@Component({
  selector: 'app-arqueos-list',
  standalone: true,
  imports: [CommonModule, DatePipe, CurrencyPipe],
  templateUrl: './arqueos-list.component.html',
})
export class ArqueosListComponent {
  @Input() arqueos: ArqueoCaja[] = [];
  @Input() isLoading: boolean = false;
}

