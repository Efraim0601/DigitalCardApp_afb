import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { Card } from '../../../shared/models/card.model';
import { AdminService } from '../../../shared/services/admin.service';

@Component({
  selector: 'app-share-stats-admin-page',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './share-stats-admin.page.html',
  styleUrl: './share-stats-admin.page.css'
})
export class ShareStatsAdminPageComponent implements OnInit {
  readonly pageSize = 1000; // Load all cards for stats

  readonly q = signal('');
  readonly page = signal(1);
  readonly total = signal(0);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  readonly cards = signal<Card[]>([]);
  readonly searchQuery = signal('');
  readonly sortBy = signal<'shareCount' | 'email' | 'firstName'>('shareCount');
  readonly sortOrder = signal<'asc' | 'desc'>('desc');

  constructor(private readonly adminService: AdminService) {}

  ngOnInit(): void {
    void this.loadCards();
  }

  private async loadCards(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const result = await firstValueFrom(
        this.adminService.listCards({ limit: this.pageSize, offset: 0 })
      );
      if (result) {
        this.cards.set(result.items);
        this.total.set(result.total);
      } else {
        this.cards.set([]);
        this.total.set(0);
      }
    } catch (err) {
      console.error('Failed to load cards:', err);
      this.error.set('admin.shareStats.errors.loadError');
      this.cards.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  readonly filteredCards = computed(() => {
    let filtered = this.cards();

    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      filtered = filtered.filter(card =>
        card.email.toLowerCase().includes(query) ||
        (card.firstName || '').toLowerCase().includes(query) ||
        (card.lastName || '').toLowerCase().includes(query) ||
        (card.title || '').toLowerCase().includes(query)
      );
    }

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (this.sortBy()) {
        case 'shareCount':
          aValue = a.shareCount || 0;
          bValue = b.shareCount || 0;
          break;
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'firstName':
          aValue = ((a.firstName || '') + ' ' + (a.lastName || '')).toLowerCase();
          bValue = ((b.firstName || '') + ' ' + (b.lastName || '')).toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return this.sortOrder() === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortOrder() === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  });

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
  }

  toggleSort(column: 'shareCount' | 'email' | 'firstName'): void {
    if (this.sortBy() === column) {
      this.sortOrder.set(this.sortOrder() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(column);
      this.sortOrder.set('desc');
    }
  }

  getFullName(card: Card): string {
    const first = card.firstName || '';
    const last = card.lastName || '';
    return `${first} ${last}`.trim() || card.email;
  }

  getShareCount(card: Card): number {
    return card.shareCount || 0;
  }

  getTotalShares(): number {
    return this.cards().reduce((sum, card) => sum + (card.shareCount || 0), 0);
  }
}
