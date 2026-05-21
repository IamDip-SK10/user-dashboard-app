import {
  Component,
  OnInit,
  ViewChild,
  ViewContainerRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  DestroyRef,
  inject,
  signal,
  computed,
  ElementRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from './user.service';
import { User } from './user.model';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dashboard-shell">
      <!-- Header -->
      <header class="dash-header">
        <div class="header-brand">
          <span class="brand-icon">⬡</span>
          <div>
            <h1 class="brand-title">UserHub</h1>
            <p class="brand-sub">Management Console</p>
          </div>
        </div>
        <button class="btn-primary" (click)="openAddUserModal()">
          <span class="btn-icon">＋</span> Add User
        </button>
      </header>

      <!-- Main Content -->
      <main class="dash-main">
        <!-- Left Panel: Table -->
        <section class="panel panel-table">
          <div class="panel-toolbar">
            <div class="search-wrap">
              <span class="search-icon">⌕</span>
              <input
                class="search-input"
                type="text"
                placeholder="Search by name or email…"
                [(ngModel)]="searchQuery"
                (ngModelChange)="onSearchChange()"
              />
            </div>
            <span class="result-count">
              {{ filteredUsers().length }} user{{ filteredUsers().length !== 1 ? 's' : '' }}
            </span>
          </div>

          <div class="table-scroll">
            <table class="user-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  *ngFor="let user of pagedUsers(); let i = index"
                  class="table-row"
                >
                  <td class="col-num">{{ (currentPage - 1) * pageSize + i + 1 }}</td>
                  <td class="col-name">
                    <span class="avatar" [attr.data-role]="user.role">
                      {{ user.name.charAt(0) }}
                    </span>
                    {{ user.name }}
                  </td>
                  <td class="col-email">{{ user.email }}</td>
                  <td>
                    <span class="role-badge" [attr.data-role]="user.role">
                      {{ user.role }}
                    </span>
                  </td>
                  <td class="col-date">{{ user.createdAt | date: 'MMM d, y' }}</td>
                  <td>
                    <button
                      class="btn-delete"
                      (click)="deleteUser(user.id)"
                      title="Remove user"
                    >✕</button>
                  </td>
                </tr>
                <tr *ngIf="pagedUsers().length === 0">
                  <td colspan="6" class="empty-state">No users match your search.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="pagination" *ngIf="totalPages() > 1">
            <button
              class="page-btn"
              [disabled]="currentPage === 1"
              (click)="goToPage(currentPage - 1)"
            >‹ Prev</button>
            <button
              *ngFor="let p of pageNumbers()"
              class="page-btn"
              [class.active]="p === currentPage"
              (click)="goToPage(p)"
            >{{ p }}</button>
            <button
              class="page-btn"
              [disabled]="currentPage === totalPages()"
              (click)="goToPage(currentPage + 1)"
            >Next ›</button>
          </div>
        </section>

        <!-- Right Panel: Chart -->
        <section class="panel panel-chart">
          <h2 class="panel-title">Role Distribution</h2>
          <div class="chart-container">
            <canvas #chartCanvas></canvas>
          </div>
          <div class="chart-legend">
            <div class="legend-item" *ngFor="let item of chartLegend">
              <span class="legend-dot" [style.background]="item.color"></span>
              <span class="legend-label">{{ item.label }}</span>
              <span class="legend-value">{{ item.count }}</span>
            </div>
          </div>
        </section>
      </main>

      <!-- Lazy-loaded modal host + backdrop -->
      <div
        class="modal-backdrop"
        [class.visible]="showModal"
        (click)="closeModal()"
      ></div>
      <ng-container #modalHost></ng-container>
    </div>
  `,
  styles: [`
    /* ── Tokens ── */
    :host {
      --primary: #1c4980;
      --primary-light: #2563ab;
      --primary-dark: #12305a;
      --neutral-dark: #383838;
      --neutral-mid: #6b7280;
      --neutral-light: #f3f6fb;
      --surface: #ffffff;
      --border: #dde3ed;
      --danger: #dc2626;
      --danger-light: #fef2f2;
      --role-admin: #7c3aed;
      --role-editor: #0891b2;
      --role-viewer: #059669;
      --radius: 10px;
      --shadow-sm: 0 1px 3px rgba(28,73,128,.08), 0 1px 2px rgba(0,0,0,.04);
      --shadow-md: 0 4px 16px rgba(28,73,128,.12), 0 2px 6px rgba(0,0,0,.06);
      --h-input: 48px;
      display: block;
      font-family: 'DM Sans', 'Segoe UI', sans-serif;
    }

    /* ── Shell ── */
    .dashboard-shell {
      min-height: 100vh;
      background: var(--neutral-light);
      padding: 0 0 48px;
    }

    /* ── Header ── */
    .dash-header {
      background: var(--primary);
      color: #fff;
      padding: 0 32px;
      height: 68px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 2px 12px rgba(28,73,128,.3);
    }
    .header-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-icon {
      font-size: 28px;
      opacity: .85;
    }
    .brand-title {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -.3px;
    }
    .brand-sub {
      margin: 0;
      font-size: 11px;
      opacity: .65;
      letter-spacing: .5px;
      text-transform: uppercase;
    }

    /* ── Buttons ── */
    .btn-primary {
      height: var(--h-input);
      padding: 0 24px;
      background: #fff;
      color: var(--primary);
      border: none;
      border-radius: var(--radius);
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: background .15s, box-shadow .15s, transform .1s;
      box-shadow: 0 2px 8px rgba(0,0,0,.15);
    }
    .btn-primary:hover {
      background: #eaf1fb;
      box-shadow: 0 4px 12px rgba(0,0,0,.2);
      transform: translateY(-1px);
    }
    .btn-primary:focus-visible {
      outline: 3px solid rgba(255,255,255,.7);
      outline-offset: 2px;
    }
    .btn-icon { font-size: 18px; }

    /* ── Main ── */
    .dash-main {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 24px;
      padding: 28px 32px 0;
    }
    @media (max-width: 900px) {
      .dash-main { grid-template-columns: 1fr; }
    }

    /* ── Panels ── */
    .panel {
      background: var(--surface);
      border-radius: var(--radius);
      box-shadow: var(--shadow-md);
      overflow: hidden;
    }

    /* ── Toolbar ── */
    .panel-toolbar {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
    }
    .search-wrap {
      flex: 1;
      position: relative;
    }
    .search-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 18px;
      color: var(--neutral-mid);
      pointer-events: none;
    }
    .search-input {
      width: 100%;
      height: var(--h-input);
      padding: 0 16px 0 42px;
      border: 1.5px solid var(--border);
      border-radius: 8px;
      font-size: 14px;
      color: var(--neutral-dark);
      background: var(--neutral-light);
      box-sizing: border-box;
      transition: border-color .15s, box-shadow .15s;
      outline: none;
    }
    .search-input:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(28,73,128,.15);
    }
    .result-count {
      font-size: 13px;
      color: var(--neutral-mid);
      white-space: nowrap;
    }

    /* ── Table ── */
    .table-scroll { overflow-x: auto; }
    .user-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    .user-table thead tr {
      background: var(--neutral-light);
    }
    .user-table th {
      padding: 12px 16px;
      text-align: left;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: .7px;
      text-transform: uppercase;
      color: var(--neutral-mid);
      border-bottom: 1px solid var(--border);
      white-space: nowrap;
    }
    .table-row {
      border-bottom: 1px solid var(--border);
      transition: background .12s;
    }
    .table-row:last-child { border-bottom: none; }
    .table-row:hover { background: #f7faff; }
    .user-table td {
      padding: 13px 16px;
      color: var(--neutral-dark);
      vertical-align: middle;
    }
    .col-num { color: var(--neutral-mid); font-size: 12px; width: 40px; }
    .col-name {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 600;
      white-space: nowrap;
    }
    .col-email { color: var(--neutral-mid); font-size: 13px; }
    .col-date { color: var(--neutral-mid); font-size: 13px; white-space: nowrap; }
    .avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      font-size: 13px;
      font-weight: 700;
      color: #fff;
      flex-shrink: 0;
    }
    .avatar[data-role="Admin"] { background: var(--role-admin); }
    .avatar[data-role="Editor"] { background: var(--role-editor); }
    .avatar[data-role="Viewer"] { background: var(--role-viewer); }

    /* ── Role Badge ── */
    .role-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: .4px;
    }
    .role-badge[data-role="Admin"] {
      background: #ede9fe; color: var(--role-admin);
    }
    .role-badge[data-role="Editor"] {
      background: #e0f2fe; color: var(--role-editor);
    }
    .role-badge[data-role="Viewer"] {
      background: #d1fae5; color: var(--role-viewer);
    }

    /* ── Delete Button ── */
    .btn-delete {
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      color: var(--neutral-mid);
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      transition: background .12s, color .12s;
    }
    .btn-delete:hover { background: var(--danger-light); color: var(--danger); }

    /* ── Empty State ── */
    .empty-state {
      text-align: center;
      padding: 40px !important;
      color: var(--neutral-mid);
      font-style: italic;
    }

    /* ── Pagination ── */
    .pagination {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 14px 20px;
      border-top: 1px solid var(--border);
      justify-content: center;
    }
    .page-btn {
      height: 36px;
      min-width: 36px;
      padding: 0 10px;
      border: 1.5px solid var(--border);
      border-radius: 7px;
      background: var(--surface);
      color: var(--neutral-dark);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all .12s;
    }
    .page-btn:hover:not(:disabled) {
      border-color: var(--primary);
      color: var(--primary);
    }
    .page-btn.active {
      background: var(--primary);
      border-color: var(--primary);
      color: #fff;
      font-weight: 700;
    }
    .page-btn:disabled {
      opacity: .4;
      cursor: not-allowed;
    }

    /* ── Chart Panel ── */
    .panel-chart {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .panel-title {
      margin: 0;
      font-size: 15px;
      font-weight: 700;
      color: var(--neutral-dark);
      letter-spacing: -.2px;
    }
    .chart-container {
      position: relative;
      width: 100%;
      aspect-ratio: 1;
      max-width: 260px;
      margin: 0 auto;
    }
    .chart-legend {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .legend-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .legend-label {
      flex: 1;
      font-size: 13px;
      color: var(--neutral-dark);
    }
    .legend-value {
      font-size: 13px;
      font-weight: 700;
      color: var(--neutral-dark);
    }

    /* ── Modal Backdrop ── */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(10,20,40,.55);
      z-index: 100;
      opacity: 0;
      pointer-events: none;
      transition: opacity .25s ease;
      backdrop-filter: blur(3px);
    }
    .modal-backdrop.visible {
      opacity: 1;
      pointer-events: all;
    }
  `],
})
export class UserDashboardComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('modalHost', { read: ViewContainerRef }) modalHost!: ViewContainerRef;
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  allUsers = signal<User[]>([]);
  searchQuery = '';
  currentPage = 1;
  readonly pageSize = 5;
  showModal = false;
  chartLegend: { label: string; color: string; count: number }[] = [];

  private chartInstance: any = null;
  private readonly CHART_COLORS: Record<string, string> = {
    Admin: '#7c3aed',
    Editor: '#0891b2',
    Viewer: '#059669',
  };

  filteredUsers = computed(() => {
  const users = this.allUsers();

  const q = this.searchQuery.trim().toLowerCase();

  if (!q) return users;

  return users.filter(
    (u) =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
  );
});


  totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredUsers().length / this.pageSize))
  );

  pagedUsers = computed(() => {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredUsers().slice(start, start + this.pageSize);
  });

  pageNumbers = computed(() =>
    Array.from({ length: this.totalPages() }, (_, i) => i + 1)
  );

  ngOnInit(): void {
    this.userService.users$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((users) => {
  this.allUsers.set(users);

  this.currentPage = 1;

  this.buildChartLegend(users);

  this.cdr.markForCheck();

  this.updateChart(users);
});

    // Lazy-load Chart.js — NOT part of initial bundle
    import('chart.js/auto').then((ChartModule) => {
      const Chart = ChartModule.default;
      this.initChart(Chart);
    });
  }

  onSearchChange(): void {
  this.currentPage = 1;
}


  goToPage(page: number): void {
    this.currentPage = page;
    this.cdr.markForCheck();
  }

  deleteUser(id: string): void {
    this.userService.deleteUser(id);
  }

  async openAddUserModal(): Promise<void> {
    this.showModal = true;
    this.cdr.markForCheck();

    // Lazy-load the form component module dynamically
    const { UserFormComponent } = await import('./user-form.component');
    this.modalHost.clear();
    const ref = this.modalHost.createComponent(UserFormComponent);

    ref.instance.closed.subscribe(() => this.closeModal());
    ref.instance.userAdded.subscribe((payload: Omit<any, 'id' | 'createdAt'>) => {
      this.userService.addUser(payload);
      this.closeModal();
    });
    ref.changeDetectorRef.detectChanges();
  }

  closeModal(): void {
    this.showModal = false;
    this.modalHost.clear();
    this.cdr.markForCheck();
  }

  private buildChartLegend(users: User[]): void {
    const counts: Record<string, number> = { Admin: 0, Editor: 0, Viewer: 0 };
    users.forEach((u) => counts[u.role]++);
    this.chartLegend = Object.entries(counts).map(([label, count]) => ({
      label,
      count,
      color: this.CHART_COLORS[label],
    }));
  }

  private initChart(Chart: any): void {
    if (!this.chartCanvas?.nativeElement) return;
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const users = this.allUsers();
    const counts = this.getRoleCounts(users);

    this.chartInstance = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: Object.keys(counts),
        datasets: [
          {
            data: Object.values(counts),
            backgroundColor: Object.keys(counts).map(
              (r) => this.CHART_COLORS[r]
            ),
            borderColor: '#ffffff',
            borderWidth: 3,
            hoverOffset: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx: any) =>
                ` ${ctx.label}: ${ctx.parsed} user${ctx.parsed !== 1 ? 's' : ''}`,
            },
          },
        },
        animation: { duration: 600, easing: 'easeInOutQuart' },
      },
    });
  }

  private updateChart(users: User[]): void {
    if (!this.chartInstance) return;
    const counts = this.getRoleCounts(users);
    this.chartInstance.data.datasets[0].data = Object.values(counts);
    this.chartInstance.update();
  }

  private getRoleCounts(users: User[]): Record<string, number> {
    const counts: Record<string, number> = { Admin: 0, Editor: 0, Viewer: 0 };
    users.forEach((u) => counts[u.role]++);
    return counts;
  }
}