import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Plan } from '../../models/plan.model';

@Component({
  standalone: true,
  selector: 'app-plan-card',
  templateUrl: './plan-card.component.html',
  styleUrl: './plan-card.component.css'
})
export class PlanCardComponent {
  @Input({ required: true }) plan!: Plan;
  @Input() highlighted = false;
  @Input() currentPlanId: string | null = null;
  @Input() blockedReason: string | null = null;
  @Input() iconIndex = 0;
  @Output() select = new EventEmitter<string>();

  private readonly icons = [
    'assets/img/icons/price-01.svg',
    'assets/img/icons/price-02.svg',
    'assets/img/icons/price-03.svg'
  ];

  get iconSrc(): string {
    return this.icons[this.iconIndex % 3];
  }

  get isCurrentPlan(): boolean {
    return this.currentPlanId === this.plan.id;
  }

  get isSelectionBlocked(): boolean {
    return !!this.blockedReason;
  }

  get durationLabel(): string {
    if (!this.plan.durationInDays) return 'Lifetime';
    if (this.plan.durationInDays === 30) return 'Per Month';
    if (this.plan.durationInDays === 365) return 'Per Year';
    return `${this.plan.durationInDays} Days`;
  }

  get formattedPrice(): string {
    return this.plan.price.toFixed(2);
  }

  get includedCapabilities(): string[] {
    const capabilities = this.plan.capabilities ?? [];
    const labels: string[] = [];

    if (capabilities.includes('SESSION_BOOKING')) {
      labels.push('Coach session booking included');
    }
    if (capabilities.includes('AI_COACH')) {
      labels.push('AI Coach included');
    }

    return labels;
  }

  onSelect(): void {
    if (!this.isCurrentPlan && !this.isSelectionBlocked) {
      this.select.emit(this.plan.id);
    }
  }
}
