import { Component, Input, Output, EventEmitter, signal } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-confirm-modal',
  templateUrl: './confirm-modal.component.html'
})
export class ConfirmModalComponent {
  @Input() title        = 'Confirm';
  @Input() message      = 'Are you sure?';
  @Input() confirmLabel = 'Confirm';
  @Input() cancelLabel  = 'Cancel';
  @Input() confirmClass = 'btn-danger';

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  isVisible = signal(false);

  open(): void  { this.isVisible.set(true); }
  close(): void { this.isVisible.set(false); }

  onConfirm(): void {
    this.isVisible.set(false);
    this.confirmed.emit();
  }

  onCancel(): void {
    this.isVisible.set(false);
    this.cancelled.emit();
  }
}
