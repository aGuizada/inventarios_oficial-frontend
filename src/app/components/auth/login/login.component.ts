import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;

  images = [
    '/assets/images/carousel-1.jpg',
    '/assets/images/carousel-2 (2).jpg'
  ];
  currentImageIndex = 0;
  private intervalId: any;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      usuario: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      remember: [false]
    });
  }

  ngOnInit() {
    this.startCarousel();
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  startCarousel() {
    this.intervalId = setInterval(() => {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.images.length;
    }, 3000);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { usuario, password } = this.loginForm.value;

    this.authService.login({ usuario, password }).subscribe({
      next: () => {
        this.isLoading = false;
        if (this.authService.isVendedor()) {
          this.router.navigate(['/ventas/nueva']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Error al iniciar sesión. Verifique sus credenciales.';
      }
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }
}
