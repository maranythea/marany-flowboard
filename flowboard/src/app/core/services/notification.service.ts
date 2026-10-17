import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface AppNotification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string; // 'info' | 'ai' | 'tip' | 'success' | 'warning'
  isRead: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly apiUrl = `${environment.apiUrl}/notifications`;

  private readonly _notifications = signal<AppNotification[]>([]);
  private readonly _unreadCount = signal<number>(0);
  private readonly _isLoading = signal<boolean>(false);

  readonly notifications = this._notifications.asReadonly();
  readonly unreadCount = this._unreadCount.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

  constructor(private readonly http: HttpClient) {}

  // =========================================================
  // FETCH ALL NOTIFICATIONS
  // =========================================================
  loadNotifications(): Observable<AppNotification[]> {
    this._isLoading.set(true);
    return this.http.get<AppNotification[]>(this.apiUrl).pipe(
      tap({
        next: (items) => {
          this._notifications.set(items || []);
          const count = (items || []).filter((n) => !n.isRead).length;
          this._unreadCount.set(count);
          this._isLoading.set(false);
        },
        error: (err) => {
          console.error('Failed to load notifications:', err);
          this._isLoading.set(false);
        },
      })
    );
  }

  // =========================================================
  // FETCH UNREAD COUNT
  // =========================================================
  loadUnreadCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/unread-count`).pipe(
      tap({
        next: (count) => {
          this._unreadCount.set(count);
        },
        error: (err) => {
          console.error('Failed to load unread count:', err);
        },
      })
    );
  }

  // =========================================================
  // MARK SINGLE NOTIFICATION AS READ
  // =========================================================
  markAsRead(id: number): Observable<unknown> {
    // Optimistic update
    this._notifications.update((items) =>
      items.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    this._unreadCount.update((count) => Math.max(0, count - 1));

    return this.http.patch(`${this.apiUrl}/${id}/read`, {}).pipe(
      tap({
        error: (err) => {
          console.error(`Failed to mark notification ${id} as read:`, err);
          // Re-sync on failure
          this.loadNotifications().subscribe();
        },
      })
    );
  }

  // =========================================================
  // MARK ALL NOTIFICATIONS AS READ
  // =========================================================
  markAllAsRead(): Observable<unknown> {
    // Optimistic update
    this._notifications.update((items) =>
      items.map((n) => ({ ...n, isRead: true }))
    );
    this._unreadCount.set(0);

    return this.http.patch(`${this.apiUrl}/read-all`, {}).pipe(
      tap({
        error: (err) => {
          console.error('Failed to mark all notifications as read:', err);
          // Re-sync on failure
          this.loadNotifications().subscribe();
        },
      })
    );
  }

  // =========================================================
  // HELPER: FORMAT RELATIVE TIME
  // =========================================================
  formatTimeAgo(dateString: string | Date): string {
    if (!dateString) return 'Just now';

    const date = new Date(dateString);
    const now = new Date();
    const elapsedSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (elapsedSeconds < 60) {
      return 'Just now';
    }

    const minutes = Math.floor(elapsedSeconds / 60);
    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours}h ago`;
    }

    const days = Math.floor(hours / 24);
    if (days === 1) {
      return 'Yesterday';
    }
    if (days < 7) {
      return `${days}d ago`;
    }

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  }
}
