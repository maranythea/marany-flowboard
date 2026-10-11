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
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent implements AfterViewInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly themeService = inject(ThemeService);

  readonly isDarkMode = this.themeService.isDarkMode;
  readonly errorMessage = signal<string | null>(null);
  readonly isLoading = signal<boolean>(false);

  private readonly googleClientId =
    '583062011127-4uad5tcgiutk2ncq3p9etg3vh8f2jlrf.apps.googleusercontent.com';

  private googleCredential: string | null = null;

  registerForm = new FormGroup({
    firstName: new FormControl('', [
      Validators.required,
      Validators.minLength(2),
    ]),

    lastName: new FormControl('', [
      Validators.required,
      Validators.minLength(2),
    ]),

    email: new FormControl('', [Validators.required, Validators.email]),

    password: new FormControl('', [
      Validators.required,
      Validators.minLength(8),
    ]),

    confirmPassword: new FormControl('', [Validators.required]),
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
    document.querySelectorAll('iframe[src*="accounts.google.com/gsi"]').forEach((el) => el.remove());
  }

  private initializeGoogleSignIn(): void {
    if (typeof google === 'undefined') {
      console.warn('Google Identity Services has not loaded.');
      return;
    }

    const googleButton = document.getElementById('google-button');

    if (!googleButton) {
      return;
    }

    google.accounts.id.initialize({
      client_id: this.googleClientId,
      callback: (response) => {
        this.handleGoogleAccount(response.credential);
      },
    });

    google.accounts.id.renderButton(googleButton, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      width: 340,
    });
  }

  private handleGoogleAccount(credential: string): void {
    this.googleCredential = credential;
    this.errorMessage.set(null);
    this.isLoading.set(true);

    // 1-Click Google Register / Login
    this.authService.googleRegister(credential).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.cleanupGooglePrompt();
        this.router.navigate(['/dashboard']);
      },
      error: (regError) => {
        // If account already exists or register threw, fallback to googleLogin
        this.authService.googleLogin(credential).subscribe({
          next: () => {
            this.isLoading.set(false);
            this.cleanupGooglePrompt();
            this.router.navigate(['/dashboard']);
          },
          error: (loginError) => {
            this.isLoading.set(false);
            // Also autofill profile info if available
            this.authService.getGoogleProfile(credential).subscribe({
              next: (profile) => {
                this.registerForm.patchValue({
                  firstName: profile.firstName,
                  lastName: profile.lastName,
                  email: profile.email,
                });
              },
            });

            const msg =
              loginError?.error?.message ||
              regError?.error?.message ||
              'Google authentication failed. Please try again or create an account with email.';
            this.errorMessage.set(Array.isArray(msg) ? msg.join(', ') : msg);
          },
        });
      },
    });
  }

  onSubmit(): void {
    this.errorMessage.set(null);

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const { firstName, lastName, email, password, confirmPassword } =
      this.registerForm.getRawValue();

    if (password !== confirmPassword) {
      this.errorMessage.set('Passwords do not match.');
      return;
    }

    this.isLoading.set(true);

    this.authService
      .register(`${firstName} ${lastName}`, email!, password!)
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.cleanupGooglePrompt();
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.isLoading.set(false);
          const msg =
            error?.error?.message ||
            'Registration failed. Please check your credentials and try again.';
          this.errorMessage.set(Array.isArray(msg) ? msg.join(', ') : msg);
        },
      });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}


