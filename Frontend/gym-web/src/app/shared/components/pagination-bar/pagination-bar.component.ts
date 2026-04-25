import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-pagination-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination-bar.component.html',
  styleUrl: './pagination-bar.component.css'
})
export class PaginationBarComponent {
  @Input() page = 1;
  @Input() pageSize = 10;
  @Input() totalItems = 0;
  @Input() totalPages = 0;
  @Input() label = 'results';

  @Output() pageChange = new EventEmitter<number>();

  get firstItemIndex(): number {
    return this.totalItems === 0 ? 0 : (this.page - 1) * this.pageSize + 1;
  }

  get lastItemIndex(): number {
    return Math.min(this.totalItems, this.page * this.pageSize);
  }

  get visiblePages(): number[] {
    if (this.totalPages <= 0) return [];

    let start = Math.max(1, this.page - 1);
    let end = Math.min(this.totalPages, start + 2);

    if (end - start < 2) {
      start = Math.max(1, end - 2);
    }

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }

  selectPage(targetPage: number): void {
    if (targetPage < 1 || targetPage > this.totalPages || targetPage === this.page) {
      return;
    }

    this.pageChange.emit(targetPage);
  }
}
