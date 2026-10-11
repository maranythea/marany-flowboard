import { Component, inject, OnInit, HostListener } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { NotificationService, AppNotification } from '../../core/services/notification.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  badge?: string;
}

interface CommandItem {
  title: string;
  subtitle: string;
  route: string;
  category: string;
  icon: string;
}

interface ChatMessage {
  sender: 'ai' | 'user';
  text: string;
  time: string;
}

@Component({
  selector: 'app-main-layout',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent implements OnInit {
  readonly authService = inject(AuthService);
  readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly themeService = inject(ThemeService);

  readonly isDarkMode = this.themeService.isDarkMode;

  // Sidebar & Menus State
  isSidebarCollapsed = false;
  isProfileMenuOpen = false;
  isNotificationMenuOpen = false;

  ngOnInit(): void {
    this.cleanupGooglePrompt();
    this.notificationService.loadNotifications().subscribe();
  }

  private cleanupGooglePrompt(): void {
    try {
      const g = (window as unknown as { google?: { accounts?: { id?: { cancel?: () => void } } } }).google;
      if (g?.accounts?.id?.cancel) {
        g.accounts.id.cancel();
      }
    } catch {
      // Ignore
    }
    const picker = document.getElementById('credential_picker_container');
    if (picker) {
      picker.remove();
    }
    const pickerIframe = document.getElementById('credential_picker_iframe');
    if (pickerIframe) {
      pickerIframe.remove();
    }
    document.querySelectorAll('iframe[src*="accounts.google.com/gsi"]').forEach((el) => el.remove());
  }


  // Nova AI Drawer State
  isAIDrawerOpen = false;
  aiChatInput = '';
  aiMessages: ChatMessage[] = [
    {
      sender: 'ai',
      text: '✦ Good evening! I am **Nova**, your FlowBoard AI Assistant. You have 3 priority actions queued for today and your focus calibration is at 94%. How can I assist your workflow right now?',
      time: 'Just now'
    }
  ];


  // Command Palette State (⌘K)
  isCommandPaletteOpen = false;
  commandSearchQuery = '';

  // Quick Add FAB Modal State
  isQuickAddOpen = false;

  readonly navItems: NavItem[] = [
    { label: 'Today', route: '/dashboard', icon: '◫' },
    { label: 'Tasks', route: '/tasks', icon: '✓', badge: '5' },
    { label: 'Calendar', route: '/calendar', icon: '📅' },
    { label: 'Goals', route: '/goals', icon: '🎯' },
    { label: 'Projects', route: '/projects', icon: '📁', badge: '3' },
    { label: 'Habits', route: '/habits', icon: '⚡' },
    { label: 'Fitness', route: '/fitness', icon: '💪' },
    { label: 'Library', route: '/library', icon: '📚' },
    { label: 'Dates', route: '/dates', icon: '⏰' },
    { label: 'Brainstorming', route: '/brainstorming', icon: '💡' },
    { label: 'People', route: '/people', icon: '👥' },
    { label: 'Finance', route: '/finance', icon: '💳' },
    { label: 'Agents', route: '/agents', icon: '🤖' },
    { label: 'Analytics', route: '/analytics', icon: '📈' },
    { label: 'Domains', route: '/domains', icon: '🏷️' },
    { label: "Where I'm At", route: '/where-im-at', icon: '📍' },
    { label: 'Journal', route: '/journal', icon: '📖' },
    { label: 'Graph', route: '/graph', icon: '🕸️' },
    { label: 'Feedback', route: '/feedback', icon: '💬' },
    { label: 'Settings', route: '/settings', icon: '⚙️' }
  ];

  readonly commandDatabase: CommandItem[] = [
    { title: 'Today Dashboard', subtitle: 'View daily schedule, priority focus & focus timer', route: '/dashboard', category: 'Navigation', icon: '◫' },
    { title: 'Tasks & Eisenhower Matrix', subtitle: 'Manage Kanban tasks and action items', route: '/tasks', category: 'Navigation', icon: '✓' },
    { title: 'Projects Life OS', subtitle: 'Multi-level Kanban subprojects & milestones', route: '/projects', category: 'Navigation', icon: '📁' },
    { title: 'Goals & OKRs', subtitle: 'Quarterly objectives and key results', route: '/goals', category: 'Navigation', icon: '🎯' },
    { title: 'Calendar Schedule', subtitle: 'Monthly timeline and timeblocking', route: '/calendar', category: 'Navigation', icon: '📅' },
    { title: 'Habits Tracker', subtitle: 'Daily consistency streaks and completion heatmaps', route: '/habits', category: 'Navigation', icon: '⚡' },
    { title: 'Fitness & Macros', subtitle: 'Workout routine splits and calorie targets', route: '/fitness', category: 'Navigation', icon: '💪' },
    { title: 'Library & Knowledge', subtitle: 'Reading progress and book summaries', route: '/library', category: 'Navigation', icon: '📚' },
    { title: 'Dates & Countdowns', subtitle: 'Track milestone deadlines and events', route: '/dates', category: 'Navigation', icon: '⏰' },
    { title: 'Brainstorming Canvas', subtitle: 'Sticky notes and scratchpad ideas', route: '/brainstorming', category: 'Navigation', icon: '💡' },
    { title: 'People CRM', subtitle: 'Relationship touchpoints and network directory', route: '/people', category: 'Navigation', icon: '👥' },
    { title: 'Finance OS', subtitle: 'Cashflow, expenses, and SaaS subscriptions', route: '/finance', category: 'Navigation', icon: '💳' },
    { title: 'AI Autonomous Agents', subtitle: 'Configure background workflows & prompts', route: '/agents', category: 'Navigation', icon: '🤖' },
    { title: 'Analytics Dashboard', subtitle: 'Performance insights and claims metrics', route: '/analytics', category: 'Navigation', icon: '📈' },
    { title: 'Domains Portfolio', subtitle: 'Work, Side Project, School, Personal hubs', route: '/domains', category: 'Navigation', icon: '🏷️' },
    { title: "Where I'm At Audit", subtitle: 'Wheel of life balance evaluation', route: '/where-im-at', category: 'Navigation', icon: '📍' },
    { title: 'Daily Journal', subtitle: 'Morning intentions and evening reflections', route: '/journal', category: 'Navigation', icon: '📖' },
    { title: 'Knowledge Graph', subtitle: 'Interactive node network of life systems', route: '/graph', category: 'Navigation', icon: '🕸️' },
    { title: 'Settings & Preferences', subtitle: 'Dark obsidian themes and keybindings', route: '/settings', category: 'Navigation', icon: '⚙️' }
  ];

  get filteredCommands(): CommandItem[] {
    if (!this.commandSearchQuery.trim()) {
      return this.commandDatabase.slice(0, 8);
    }
    const q = this.commandSearchQuery.toLowerCase();
    return this.commandDatabase.filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.subtitle.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q)
    );
  }

  get userInitial(): string {
    return this.authService.user()?.name?.charAt(0).toUpperCase() ?? 'M';
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.profile-container')) {
      this.isProfileMenuOpen = false;
    }
    if (!target.closest('.notification-container')) {
      this.isNotificationMenuOpen = false;
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcuts(event: KeyboardEvent): void {
    // Cmd+K or Ctrl+K
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.toggleCommandPalette();
    }
    // Escape key
    if (event.key === 'Escape') {
      this.isCommandPaletteOpen = false;
      this.isAIDrawerOpen = false;
      this.isQuickAddOpen = false;
      this.isProfileMenuOpen = false;
      this.isNotificationMenuOpen = false;
    }
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  toggleProfileMenu(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
    if (this.isProfileMenuOpen) {
      this.isNotificationMenuOpen = false;
    }
  }

  toggleNotificationMenu(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.isNotificationMenuOpen = !this.isNotificationMenuOpen;
    if (this.isNotificationMenuOpen) {
      this.isProfileMenuOpen = false;
      this.notificationService.loadNotifications().subscribe();
    }
  }


  markAllNotificationsRead(): void {
    this.notificationService.markAllAsRead().subscribe();
  }

  markNotificationRead(notification: AppNotification, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id).subscribe();
    }
  }

  formatNotificationTime(dateString: string): string {
    return this.notificationService.formatTimeAgo(dateString);
  }


  toggleAIDrawer(): void {
    this.isAIDrawerOpen = !this.isAIDrawerOpen;
  }

  toggleCommandPalette(): void {
    this.isCommandPaletteOpen = !this.isCommandPaletteOpen;
    if (this.isCommandPaletteOpen) {
      this.commandSearchQuery = '';
    }
  }

  selectCommand(item: CommandItem): void {
    this.isCommandPaletteOpen = false;
    this.router.navigate([item.route]);
  }

  sendAIMessage(): void {
    if (!this.aiChatInput.trim()) return;

    const userText = this.aiChatInput.trim();
    this.aiMessages.push({
      sender: 'user',
      text: userText,
      time: 'Just now'
    });
    this.aiChatInput = '';

    // Simulated intelligent response
    setTimeout(() => {
      let reply = '✦ I have processed your request. Your schedule and tasks have been calibrated. Let me know if you would like me to generate a breakdown or execute an automated agent trigger!';
      
      if (userText.toLowerCase().includes('plan') || userText.toLowerCase().includes('today')) {
        reply = '✦ **Today\'s Recommended Action Plan:**\n1. Complete Deep Work on FlowBoard Navigation (high leverage).\n2. Sync with team at 11:30 AM.\n3. Dedicate 45 mins to Machine Learning study.\n\nShall I block these on your Calendar?';
      } else if (userText.toLowerCase().includes('project') || userText.toLowerCase().includes('task')) {
        reply = '✦ **Project Breakdown Analysis:** I analyzed **FlowBoard Life OS**. 3 active subprojects are currently in progress. Next recommended task: *Verify route navigation and dark theme styling*.';
      }

      this.aiMessages.push({
        sender: 'ai',
        text: reply,
        time: 'Just now'
      });
    }, 600);
  }

  sendQuickAIPrompt(prompt: string): void {
    this.aiChatInput = prompt;
    this.sendAIMessage();
  }

  openQuickAdd(): void {
    this.isQuickAddOpen = true;
  }

  closeQuickAdd(): void {
    this.isQuickAddOpen = false;
  }

  quickAddAction(type: string): void {
    this.isQuickAddOpen = false;
    if (type === 'task') this.router.navigate(['/tasks']);
    else if (type === 'project') this.router.navigate(['/projects']);
    else if (type === 'habit') this.router.navigate(['/habits']);
    else if (type === 'idea') this.router.navigate(['/brainstorming']);
    else if (type === 'journal') this.router.navigate(['/journal']);
    else if (type === 'expense') this.router.navigate(['/finance']);
  }

  filterByDomain(domain: string): void {
    this.router.navigate(['/tasks']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}