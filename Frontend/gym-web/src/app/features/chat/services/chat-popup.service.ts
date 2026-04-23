import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ChatPopupService {

  readonly isOpen = signal(false);

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  toggle(): void {
    this.isOpen.update(isOpen => !isOpen);
  }
}
