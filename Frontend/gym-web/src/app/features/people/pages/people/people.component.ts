import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';
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
  private isSyncingQueryParam = false;

  constructor(
    private peopleService: PeopleService,
    private tokenService: TokenService,
    private router: Router,
    private route: ActivatedRoute,
    private contactCache: ContactCacheService
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.tokenService.getUserId() ?? '';
    this.bindSearch();
    this.bindQueryParamPrefill();
  }

  private bindSearch(): void {
    this.subs.add(
      this.searchControl.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(q => {
          const trimmed = (q ?? '').trim();
          this.syncQueryParam(trimmed);
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

  onSearchSubmit(): void {
    const query = this.queryValue;
    this.syncQueryParam(query);

    if (query.length < 2) {
      this.results.set([]);
      this.searched.set(false);
      this.loading.set(false);
      this.error.set(false);
    }
  }

  clearSearch(): void {
    this.searchControl.setValue('');
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

  get resultCount(): number {
    return this.results().length;
  }

  get coachCount(): number {
    return this.results().filter(person => person.role === 'COACH').length;
  }

  get memberCount(): number {
    return this.results().filter(person => person.role === 'MEMBER').length;
  }

  get heroTitle(): string {
    if (this.loading()) return 'Searching the community';
    if (this.queryValue.length >= 2 && this.resultCount > 0) return 'People ready to connect';
    return 'Discover people in your gym community';
  }

  get heroSubtitle(): string {
    if (this.queryValue.length >= 2 && this.resultCount > 0) {
      return `Browse ${this.resultCount} matching ${this.resultCount === 1 ? 'profile' : 'profiles'} and jump into a conversation fast.`;
    }
    return 'Find members and coaches by name or username, then open the full profile list or start chatting right away.';
  }

  get searchSummary(): string {
    if (this.queryValue.length < 2) return 'Start with a first name, last name, or username.';
    if (this.loading()) return `Looking for "${this.queryValue}"...`;
    if (this.error()) return 'Search is having trouble right now. Try again in a moment.';
    if (this.resultCount === 0) return `No matches for "${this.queryValue}" yet.`;
    return `${this.resultCount} match${this.resultCount === 1 ? '' : 'es'} for "${this.queryValue}"`;
  }

  getRoleLabel(person: UserSearchResult): string {
    return person.role === 'COACH' ? 'Coach' : 'Member';
  }

  getRoleAccent(person: UserSearchResult): string {
    return person.role === 'COACH' ? 'Coaching' : 'Community';
  }

  getProfileBlurb(person: UserSearchResult): string {
    return person.role === 'COACH'
      ? 'Available for coaching conversations and guidance.'
      : 'Part of the member community and ready to connect.';
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private bindQueryParamPrefill(): void {
    this.subs.add(
      this.route.queryParamMap.subscribe(params => {
        const query = (params.get('q') ?? '').trim();
        if (query !== this.queryValue) {
          this.isSyncingQueryParam = true;
          this.searchControl.setValue(query);
          queueMicrotask(() => {
            this.isSyncingQueryParam = false;
          });
        }
      })
    );
  }

  private syncQueryParam(query: string): void {
    if (this.isSyncingQueryParam) return;

    const current = (this.route.snapshot.queryParamMap.get('q') ?? '').trim();
    if (current === query) return;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: query || null },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }
}
