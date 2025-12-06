import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';

type ProfileTab = 'info' | 'seguridad' | 'preferencias';

interface User {
  id: number;
  name: string;
  email: string;
  telefono?: string;
  avatar?: string;
  rol?: { nombre: string };
  created_at?: string;
}

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './perfil.component.html'
})
export class PerfilComponent implements OnInit {
  activeTab: ProfileTab = 'info';
  user: User | null = null;

  // Forms
  infoForm!: FormGroup;
  passwordForm!: FormGroup;
  preferencesForm!: FormGroup;

  // Avatar
  selectedAvatar: File | null = null;
  avatarPreview: string | null = null;

  // State
  isLoading = false;
  isSaving = false;
  passwordStrength: number = 0;
  showPasswordStrength = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.initForms();
    this.loadUserData();
  }

  initForms(): void {
    // Info Form
    this.infoForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      telefono: ['', [Validators.maxLength(20)]]
    });

    // Password Form
    this.passwordForm = this.fb.group({
      current_password: ['', [Validators.required]],
      new_password: ['', [Validators.required, Validators.minLength(8), this.passwordValidator]],
      confirm_password: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    // Watch password changes for strength indicator
    this.passwordForm.get('new_password')?.valueChanges.subscribe(password => {
      this.showPasswordStrength = password && password.length > 0;
      this.passwordStrength = this.calculatePasswordStrength(password);
    });

    // Preferences Form
    this.preferencesForm = this.fb.group({
      email_notifications: [true],
      system_notifications: [true]
    });
  }

  loadUserData(): void {
    this.isLoading = true;
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.user = user;
        this.infoForm.patchValue({
          name: user.name,
          email: user.email,
          telefono: user.telefono || ''
        });

        // Check if avatar exists (may not be in User type from AuthService)
        const userWithAvatar = user as any;
        if (userWithAvatar.avatar) {
          this.avatarPreview = userWithAvatar.avatar;
        }
      }
      this.isLoading = false;
    });
  }

  changeTab(tab: ProfileTab): void {
    this.activeTab = tab;
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Validate file type
      if (!file.type.match(/image\/(jpg|jpeg|png)/)) {
        alert('Solo se permiten imágenes JPG o PNG');
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('La imagen no debe exceder 2MB');
        return;
      }

      this.selectedAvatar = file;

      // Preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.avatarPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  updateProfile(): void {
    if (this.infoForm.invalid) {
      alert('Por favor complete correctamente todos los campos requeridos');
      return;
    }

    this.isSaving = true;

    const formData = new FormData();
    formData.append('name', this.infoForm.value.name);
    formData.append('email', this.infoForm.value.email);
    if (this.infoForm.value.telefono) {
      formData.append('telefono', this.infoForm.value.telefono);
    }
    if (this.selectedAvatar) {
      formData.append('avatar', this.selectedAvatar);
    }

    // TODO: Implement actual API call
    console.log('Updating profile:', this.infoForm.value);

    setTimeout(() => {
      this.isSaving = false;
      alert('Perfil actualizado exitosamente');
      this.selectedAvatar = null;
    }, 1000);
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      alert('Por favor complete correctamente todos los campos');
      return;
    }

    this.isSaving = true;

    const passwordData = {
      current_password: this.passwordForm.value.current_password,
      new_password: this.passwordForm.value.new_password
    };

    // TODO: Implement actual API call
    console.log('Changing password');

    setTimeout(() => {
      this.isSaving = false;
      alert('Contraseña cambiada exitosamente');
      this.passwordForm.reset();
      this.showPasswordStrength = false;
    }, 1000);
  }

  updatePreferences(): void {
    if (this.preferencesForm.invalid) {
      return;
    }

    this.isSaving = true;

    // TODO: Implement actual API call
    console.log('Updating preferences:', this.preferencesForm.value);

    setTimeout(() => {
      this.isSaving = false;
      alert('Preferencias actualizadas exitosamente');
    }, 1000);
  }

  // Validators
  passwordValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) {
      return null;
    }

    const hasUpperCase = /[A-Z]/.test(value);
    const hasNumber = /[0-9]/.test(value);

    const valid = hasUpperCase && hasNumber;

    return !valid ? { passwordStrength: true } : null;
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('new_password');
    const confirmPassword = control.get('confirm_password');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  calculatePasswordStrength(password: string): number {
    if (!password) return 0;

    let strength = 0;

    // Length
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;

    // Uppercase
    if (/[A-Z]/.test(password)) strength += 15;

    // Lowercase
    if (/[a-z]/.test(password)) strength += 15;

    // Numbers
    if (/[0-9]/.test(password)) strength += 10;

    // Special characters
    if (/[^A-Za-z0-9]/.test(password)) strength += 10;

    return Math.min(strength, 100);
  }

  getPasswordStrengthColor(): string {
    if (this.passwordStrength < 40) return 'bg-red-500';
    if (this.passwordStrength < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  }

  getPasswordStrengthText(): string {
    if (this.passwordStrength < 40) return 'Débil';
    if (this.passwordStrength < 70) return 'Media';
    return 'Fuerte';
  }

  getUserInitials(): string {
    if (!this.user?.name) return 'U';
    return this.user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  getAvatarUrl(): string {
    return this.avatarPreview || this.user?.avatar || '';
  }
}
