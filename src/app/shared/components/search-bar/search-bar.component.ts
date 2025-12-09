import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-bar.component.html',
})
export class SearchBarComponent implements OnInit, OnDestroy {
  @Input() placeholder: string = 'Buscar...';
  @Input() debounceTime: number = 300;
  @Input() initialValue: string = '';
  
  @Output() search = new EventEmitter<string>();
  @Output() clear = new EventEmitter<void>();

  searchTerm: string = '';
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.searchTerm = this.initialValue;
    
    // Configurar debounce para la búsqueda
    this.searchSubject.pipe(
      debounceTime(this.debounceTime),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => {
      if (term.trim() === '') {
        this.clear.emit();
      } else {
        this.search.emit(term.trim());
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.searchSubject.next(value);
  }

  onClear(): void {
    this.searchTerm = '';
    this.searchSubject.next('');
    this.clear.emit();
  }
}

