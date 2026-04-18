import { Component} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { IonContent, IonInput, IonButton, IonSpinner } from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IonContent, IonInput, IonButton, IonSpinner]
})
export class RegisterPage {
  username = "";
  email = "";
  password = "";
  confirmPassword = "";
  isLoading = false;
  errorMessage = "";


  constructor(private authService: AuthService, private router: Router) { }

  async onRegister() {
    //Make sure all fields are filled
    if (!this.username || !this.email || !this.password || !this.confirmPassword) {
      this.errorMessage = "Please fill in all fields.";
      return;
    } 

      // Check if passwords match
    if (this.password !== this.confirmPassword) {
      this.errorMessage = "Passwords do not match.";
      return;
    }

    this.isLoading = true;
    this.errorMessage = "";

    try {
      await this.authService.register(this.username, this.email, this.password);
      this.isLoading = false;

      // Navigate to login page after successful registration
      this.router.navigate(['/tabs/login'], {
        queryParams: {message: "Please check your email to verify your account"}
      });
    } catch (err: any) {
      this.isLoading = false;

      // Without these, Firebase would show raw error messages that are not user-friendly
      if (err.code === 'auth/email-already-in-use') {
        this.errorMessage = 'This email is already in use';
      } else if (err.code === 'auth/weak-password') {
        this.errorMessage = 'Password is too weak — must be at least 6 characters';
      } else if (err.code === 'auth/invalid-email') {
        this.errorMessage = 'Invalid email address';
      } else if (err.error?.username) {
        this.errorMessage = 'This username is already taken';
      } else {
        this.errorMessage = err.message || 'Registration failed. Please try again.';
      }
    }
  }

}
