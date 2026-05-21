import {
  Component,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  OnInit,
  inject,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserRole } from './user.model';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="modal-wrapper" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="modal-card" (click)="$event.stopPropagation()">

        <!-- Header -->
        <div class="modal-header">
          <div class="modal-title-group">
            <span class="modal-icon">👤</span>
            <div>
              <h2 id="modal-title" class="modal-title">Add New User</h2>
              <p class="modal-sub">Fill in the details below to create an account.</p>
            </div>
          </div>
          <button class="btn-close" (click)="onCancel()" aria-label="Close">✕</button>
        </div>

        <!-- Form -->
        <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
          <div class="modal-body">

            <!-- Name Field -->
            <div class="field-group" [class.has-error]="isInvalid('name')">
              <label class="field-label" for="name">Full Name <span class="required">*</span></label>
              <input
                id="name"
                class="field-input"
                type="text"
                formControlName="name"
                placeholder="e.g. Jane Smith"
                autocomplete="off"
              />
              <span class="field-error" role="alert" *ngIf="isInvalid('name')">
                <ng-container *ngIf="form.get('name')?.hasError('required')">
                  Name is required.
                </ng-container>
                <ng-container *ngIf="form.get('name')?.hasError('minlength')">
                  Name must be at least 2 characters.
                </ng-container>
              </span>
            </div>

            <!-- Email Field -->
            <div class="field-group" [class.has-error]="isInvalid('email')">
              <label class="field-label" for="email">Email Address <span class="required">*</span></label>
              <input
                id="email"
                class="field-input"
                type="email"
                formControlName="email"
                placeholder="e.g. jane@company.com"
                autocomplete="off"
              />
              <span class="field-error" role="alert" *ngIf="isInvalid('email')">
                <ng-container *ngIf="form.get('email')?.hasError('required')">
                  Email is required.
                </ng-container>
                <ng-container *ngIf="form.get('email')?.hasError('email')">
                  Please enter a valid email address.
                </ng-container>
              </span>
            </div>

            <!-- Role Field -->
            <div class="field-group" [class.has-error]="isInvalid('role')">
              <label class="field-label" for="role">Role <span class="required">*</span></label>
              <div class="select-wrap">
                <select
                  id="role"
                  class="field-input field-select"
                  formControlName="role"
                >
                  <option value="" disabled hidden>Select a role…</option>
                  <option *ngFor="let r of roles" [value]="r">{{ r }}</option>
                </select>
                <span class="select-arrow">▾</span>
              </div>
              <span class="field-error" role="alert" *ngIf="isInvalid('role')">
                Please select a role.
              </span>
            </div>

          </div>

          <!-- Footer -->
          <div class="modal-footer">
            <button type="button" class="btn-secondary" (click)="onCancel()">
              Cancel
            </button>
            <button
              type="submit"
              class="btn-submit"
              [disabled]="form.invalid"
              [class.loading]="submitting"
            >
              <span *ngIf="!submitting">Create User</span>
              <span *ngIf="submitting" class="spinner"></span>
            </button>
          </div>
        </form>

      </div>
    </div>
  `,
  styles: [`
    :host {
      --primary: #1c4980;
      --primary-light: #2563ab;
      --neutral-dark: #383838;
      --neutral-mid: #6b7280;
      --neutral-light: #f3f6fb;
      --surface: #ffffff;
      --border: #dde3ed;
      --error: #dc2626;
      --error-bg: #fef2f2;
      --error-border: #fca5a5;
      --radius: 12px;
      --h-input: 48px;
      display: block;
    }

    /* ── Wrapper (centered in viewport) ── */
    .modal-wrapper {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 200;
      padding: 16px;
      animation: fadeSlideIn .28s cubic-bezier(.34,1.56,.64,1) both;
    }

    @keyframes fadeSlideIn {
      from { opacity: 0; transform: translateY(24px) scale(.97); }
      to   { opacity: 1; transform: translateY(0)   scale(1);    }
    }

    /* ── Card ── */
    .modal-card {
      background: var(--surface);
      border-radius: var(--radius);
      width: 100%;
      max-width: 480px;
      box-shadow: 0 24px 60px rgba(10,20,40,.25), 0 4px 16px rgba(0,0,0,.08);
      overflow: hidden;
    }

    /* ── Header ── */
    .modal-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      padding: 24px 24px 20px;
      border-bottom: 1px solid var(--border);
      background: linear-gradient(135deg, #f0f5ff 0%, #ffffff 100%);
    }
    .modal-title-group {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    .modal-icon { font-size: 28px; line-height: 1; margin-top: 2px; }
    .modal-title {
      margin: 0 0 3px;
      font-size: 18px;
      font-weight: 700;
      color: var(--primary);
      letter-spacing: -.3px;
    }
    .modal-sub {
      margin: 0;
      font-size: 13px;
      color: var(--neutral-mid);
    }
    .btn-close {
      background: none;
      border: none;
      font-size: 16px;
      color: var(--neutral-mid);
      cursor: pointer;
      width: 32px;
      height: 32px;
      border-radius: 6px;
      display: grid;
      place-items: center;
      flex-shrink: 0;
      transition: background .12s, color .12s;
    }
    .btn-close:hover { background: #f1f5f9; color: var(--neutral-dark); }

    /* ── Body ── */
    .modal-body {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* ── Field ── */
    .field-group { display: flex; flex-direction: column; gap: 6px; }
    .field-label {
      font-size: 13px;
      font-weight: 600;
      color: var(--neutral-dark);
      letter-spacing: .1px;
    }
    .required { color: var(--error); margin-left: 2px; }
    .field-input {
      height: var(--h-input);
      padding: 0 14px;
      border: 1.5px solid var(--border);
      border-radius: 8px;
      font-size: 14px;
      color: var(--neutral-dark);
      background: var(--neutral-light);
      box-sizing: border-box;
      transition: border-color .15s, box-shadow .15s, background .15s;
      outline: none;
      width: 100%;
    }
    .field-input::placeholder { color: #b0b8c4; }
    .field-input:focus {
      border-color: var(--primary);
      background: #fff;
      box-shadow: 0 0 0 3px rgba(28,73,128,.14);
    }
    .has-error .field-input {
      border-color: var(--error-border);
      background: var(--error-bg);
    }
    .has-error .field-input:focus {
      border-color: var(--error);
      box-shadow: 0 0 0 3px rgba(220,38,38,.12);
    }
    .field-error {
      font-size: 12px;
      color: var(--error);
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .field-error::before { content: '⚠'; font-size: 11px; }

    /* ── Select ── */
    .select-wrap { position: relative; }
    .field-select {
      appearance: none;
      cursor: pointer;
      padding-right: 40px;
    }
    .select-arrow {
      position: absolute;
      right: 14px;
      top: 50%;
      transform: translateY(-50%);
      pointer-events: none;
      color: var(--neutral-mid);
      font-size: 14px;
    }

    /* ── Footer ── */
    .modal-footer {
      display: flex;
      gap: 12px;
      padding: 16px 24px 24px;
      border-top: 1px solid var(--border);
      justify-content: flex-end;
    }
    .btn-secondary {
      height: var(--h-input);
      padding: 0 22px;
      background: var(--neutral-light);
      border: 1.5px solid var(--border);
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      color: var(--neutral-dark);
      cursor: pointer;
      transition: background .12s, border-color .12s;
    }
    .btn-secondary:hover { background: #e9eef6; border-color: #c4cdd9; }
    .btn-secondary:focus-visible {
      outline: 3px solid rgba(28,73,128,.2);
      outline-offset: 2px;
    }
    .btn-submit {
      height: var(--h-input);
      padding: 0 28px;
      background: var(--primary);
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      transition: background .15s, box-shadow .15s, transform .1s, opacity .15s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      min-width: 130px;
    }
    .btn-submit:hover:not(:disabled) {
      background: var(--primary-light, #2563ab);
      box-shadow: 0 4px 14px rgba(28,73,128,.35);
      transform: translateY(-1px);
    }
    .btn-submit:focus-visible {
      outline: 3px solid rgba(28,73,128,.35);
      outline-offset: 2px;
    }
    .btn-submit:disabled {
      opacity: .45;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    /* ── Spinner ── */
    .spinner {
      width: 18px;
      height: 18px;
      border: 2.5px solid rgba(255,255,255,.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin .6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class UserFormComponent implements OnInit {
  @Output() closed = new EventEmitter<void>();
  @Output() userAdded = new EventEmitter<{ name: string; email: string; role: UserRole }>();

  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  form!: FormGroup;
  submitting = false;
  readonly roles: UserRole[] = ['Admin', 'Editor', 'Viewer'];

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      role: ['', [Validators.required]],
    });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting = true;
    // Simulate a brief async commit (e.g., API call)
    setTimeout(() => {
      this.submitting = false;
      this.userAdded.emit({
        name: this.form.value.name.trim(),
        email: this.form.value.email.trim().toLowerCase(),
        role: this.form.value.role as UserRole,
      });
    }, 480);
  }

  onCancel(): void {
    this.closed.emit();
  }
}