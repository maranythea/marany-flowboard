import { AfterViewInit, Component, inject, OnDestroy, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';

declare const google: {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (response: { credential: string }) => void;
      }) => void;

      renderButton: (
        element: HTMLElement,
        options: {
          type?: string;
          theme?: string;
          size?: string;
          text?: string;
          shape?: string;
          width?: number;
        },
      ) => void;

      cancel?: () => void;
      disableAutoSelect?: () => void;
    };
  };
};

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements AfterViewInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly themeService = inject(ThemeService);

  readonly isDarkMode = this.themeService.isDarkMode;
  readonly errorMessage = signal<string | null>(null);
  readonly isLoading = signal<boolean>(false);

  private readonly googleClientId =
    '583062011127-4uad5tcgiutk2ncq3p9etg3vh8f2jlrf.apps.googleusercontent.com';

  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(6),
    ]),
  });

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  ngAfterViewInit(): void {
    this.initializeGoogleSignIn();
  }

  ngOnDestroy(): void {
    this.cleanupGooglePrompt();
  }

  private cleanupGooglePrompt(): void {
    try {
      if (typeof google !== 'undefined' && google.accounts?.id?.cancel) {
        google.accounts.id.cancel();
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
    // Remove any iframe injected by google gsi
    document.querySelectorAll('iframe[src*="accounts.google.com/gsi"]').forEach((el) => el.remove());
  }

  private initializeGoogleSignIn(): void {
    if (typeof google === 'undefined') {
      return;
    }

    const googleButton = document.getElementById('google-login-button');
    if (!googleButton) {
      return;
    }

    google.accounts.id.initialize({
      client_id: this.googleClientId,
      callback: (response) => {
        this.handleGoogleLogin(response.credential);
      },
    });

    google.accounts.id.renderButton(googleButton, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'rectangular',
      width: 340,
    });
  }

  private handleGoogleLogin(credential: string): void {
    this.errorMessage.set(null);
    this.isLoading.set(true);

    this.authService.googleLogin(credential).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.cleanupGooglePrompt();
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.isLoading.set(false);
        const msg =
          error?.error?.message ||
          'Google Sign-In failed. Please try again.';
        this.errorMessage.set(Array.isArray(msg) ? msg.join(', ') : msg);
      },
    });
  }

  onSubmit(): void {
    this.errorMessage.set(null);

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.getRawValue();
    this.isLoading.set(true);

    this.authService.login(email!, password!).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.cleanupGooglePrompt();
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.isLoading.set(false);
        const msg =
          error?.error?.message ||
          'Invalid email or password. Please try again.';
        this.errorMessage.set(Array.isArray(msg) ? msg.join(', ') : msg);
      },
    });
  }
}


