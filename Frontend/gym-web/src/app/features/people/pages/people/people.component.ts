import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Subscription, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, tap, catchError, map } from 'rxjs/operators';

import { PeopleService } from '../../services/people.service';
import { TokenService } from '../../../../core/auth/token.service';
import { UserSearchResult } from '../../models/user-search-result.model';
import { ContactCacheService } from '../../../chat/services/contact-cache.service';
import { PaginationBarComponent } from '../../../../shared/components/pagination-bar/pagination-bar.component';
import { PagedResponse } from '../../../../core/models/paged-response.model';

@Component({
  selector: 'app-people',
  standalone: true,
  imports: [ReactiveFormsModule, PaginationBarComponent],
  templateUrl: './people.component.html',
  styleUrls: ['./people.component.css']
})
export class PeopleComponent implements OnInit, OnDestroy {

  searchControl = new FormControl('');

  results = signal<UserSearchResult[]>([]);
  loading = signal(false);
  error = signal(false);
  searched = signal(false);

  currentPage = signal(1);
  totalItems = signal(0);
  totalPages = signal(0);
  pageSize = 12;

  startingConvFor = signal<string | null>(null);

  currentUserId = '';
  private subs = new Subscription();

  constructor(
    private peopleService: PeopleService,
    private tokenService: TokenService,
    private router: Router,
    private route: ActivatedRoute,
    private contactCache: ContactCacheService
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.tokenService.isAuthenticated()
      ? (this.tokenService.getUserId() ?? '')
      : '';
    this.bindSearch();
    this.bindRouteState();
  }

  private bindSearch(): void {
    this.subs.add(
      this.searchControl.valueChanges.pipe(
        debounceTime(300),
        map(value => (value ?? '').trim()),
        distinctUntilChanged()
      ).subscribe(query => {
        if (query.length < 2) {
          this.syncQueryParams('', 1);
          this.resetSearchState();
          return;
        }

        this.syncQueryParams(query, 1);
      })
    );
  }

  private bindRouteState(): void {
    this.subs.add(
      this.route.queryParamMap.pipe(
        map(params => {
          const query = (params.get('q') ?? '').trim();
          const parsedPage = Number(params.get('page') ?? '1');
          const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
          return { query, page };
        }),
        distinctUntilChanged((a, b) => a.query === b.query && a.page === b.page),
        tap(({ query }) => {
          if (query !== this.queryValue) {
            this.searchControl.setValue(query, { emitEvent: false });
          }
        }),
        switchMap(({ query, page }) => {
          if (query.length < 2) {
            this.resetSearchState();
            return of(null);
          }

          this.loading.set(true);
          this.error.set(false);
          this.searched.set(true);
          this.currentPage.set(page);

          return this.peopleService.search(query, page, this.pageSize).pipe(
            catchError(() => {
              this.error.set(true);
              return of(this.emptyPage(page));
            })
          );
        })
      ).subscribe(page => {
        if (!page) return;

        this.loading.set(false);
        this.results.set(page.items);
        this.totalItems.set(page.totalItems);
        this.totalPages.set(page.totalPages);
        this.currentPage.set(page.page);
      })
    );
  }

  onSearchSubmit(): void {
    const query = this.queryValue;

    if (query.length < 2) {
      this.syncQueryParams('', 1);
      this.resetSearchState();
      return;
    }

    this.syncQueryParams(query, 1);
  }

  clearSearch(): void {
    this.searchControl.setValue('');
  }

  goToPage(page: number): void {
    if (page === this.currentPage()) return;
    this.syncQueryParams(this.queryValue, page);
  }

  startChat(person: UserSearchResult): void {
    this.startingConvFor.set(person.id);

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
    if (this.queryValue.length >= 2 && this.totalItems() > 0) return 'People ready to connect';
    return 'Discover people in your gym community';
  }

  get heroSubtitle(): string {
    if (this.queryValue.length >= 2 && this.totalItems() > 0) {
      return `Browse ${this.totalItems()} matching ${this.totalItems() === 1 ? 'profile' : 'profiles'} and jump into a conversation fast.`;
    }
    return 'Find members and coaches by name or username, then open the full profile list or start chatting right away.';
  }

  get searchSummary(): string {
    if (this.queryValue.length < 2) return 'Start with a first name, last name, or username.';
    if (this.loading()) return `Looking for "${this.queryValue}"...`;
    if (this.error()) return 'Search is having trouble right now. Try again in a moment.';
    if (this.totalItems() === 0) return `No matches for "${this.queryValue}" yet.`;
    return `${this.totalItems()} match${this.totalItems() === 1 ? '' : 'es'} for "${this.queryValue}"`;
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

  get canStartChat(): boolean {
    return this.tokenService.isAuthenticated();
  }

  onGuestChatIntent(): void {
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: this.router.url }
    });
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private syncQueryParams(query: string, page: number): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        q: query || null,
        page: query ? page : null
      },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  private resetSearchState(): void {
    this.results.set([]);
    this.searched.set(false);
    this.loading.set(false);
    this.error.set(false);
    this.currentPage.set(1);
    this.totalItems.set(0);
    this.totalPages.set(0);
  }

  private emptyPage(page: number): PagedResponse<UserSearchResult> {
    return {
      items: [],
      page,
      pageSize: this.pageSize,
      totalItems: 0,
      totalPages: 0,
      hasNext: false,
      hasPrevious: page > 1
    };
  }
}
