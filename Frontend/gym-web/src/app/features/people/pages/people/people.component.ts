import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { PeopleService } from '../../services/people.service';
import { TokenService } from '../../../../core/auth/token.service';
import { UserSearchResult } from '../../models/user-search-result.model';
import { ContactCacheService } from '../../../chat/services/contact-cache.service';

@Component({
  selector: 'app-people',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './people.component.html',
  styleUrls: ['./people.component.css']
})
export class PeopleComponent implements OnInit, OnDestroy {

  searchControl = new FormControl('');

  results  = signal<UserSearchResult[]>([]);
  loading  = signal(false);
  error    = signal(false);
  searched = signal(false);

  startingConvFor = signal<string | null>(null);

  currentUserId = '';
  private subs = new Subscription();

  constructor(
    private peopleService: PeopleService,
    private tokenService: TokenService,
    private router: Router,
    private contactCache: ContactCacheService
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.tokenService.getUserId() ?? '';

    this.subs.add(
      this.searchControl.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(q => {
          const trimmed = (q ?? '').trim();
          if (trimmed.length < 2) {
            this.results.set([]);
            this.searched.set(false);
            this.loading.set(false);
            this.error.set(false);
          }
        }),
        switchMap(q => {
          const trimmed = (q ?? '').trim();
          if (trimmed.length < 2) return of(null);

          this.loading.set(true);
          this.error.set(false);
          this.searched.set(true);

          return this.peopleService.search(trimmed).pipe(
            catchError(() => {
              this.error.set(true);
              return of([] as UserSearchResult[]);
            })
          );
        })
      ).subscribe(res => {
        if (res === null) return;
        this.loading.set(false);
        this.results.set(res);
      })
    );
  }

  startChat(person: UserSearchResult): void {
    this.startingConvFor.set(person.id);

    // Seed the contact cache before navigating so the chat page can display
    // the person's name and avatar without needing a backend lookup.
    this.contactCache.seedFromResult(person);

    this.subs.add(
      this.peopleService.getOrCreateConversation(this.currentUserId, person.id)
        .subscribe({
          next: conv => {
            this.startingConvFor.set(null);
            this.router.navigate(['/chat'], { state: { openConversationId: conv._id } });
          },
          error: () => {
            this.startingConvFor.set(null);
          }
        })
    );
  }

  getInitials(person: UserSearchResult): string {
    const f = person.firstName?.[0] ?? '';
    const l = person.lastName?.[0] ?? '';
    return (f + l).toUpperCase() || person.username[0].toUpperCase();
  }

  get queryValue(): string {
    return (this.searchControl.value ?? '').trim();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
