import { Pipe, PipeTransform } from '@angular/core';
import { MonedaActivaService } from '../services/moneda-activa.service';

@Pipe({
  name: 'moneda',
  standalone: true
})
export class MonedaPipe implements PipeTransform {
  constructor(private monedaActivaService: MonedaActivaService) {}

  transform(value: number | string | null | undefined): string {
    return this.monedaActivaService.formatearMoneda(value);
  }
}



