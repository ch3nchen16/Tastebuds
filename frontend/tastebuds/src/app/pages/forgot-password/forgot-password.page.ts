import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonContent, IonInput, IonButton, IonSpinner } from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IonContent, IonInput, IonButton, IonSpinner],
})
export class ForgotPasswordPage {

  usernameOrEmail = "";
  isLoading = false;
  errorMessage = "";
  successMessage = "";

  constructor(private authService: AuthService) {}

  //async bcz firebase calls are asynchronous and we need to await them
  // If Input is empty
  async onForgotPassword() {
    if (!this.usernameOrEmail) {
      this.errorMessage = "Please enter your username or email";
      return;
    }

    this.isLoading = true; //shows spinner and disables btn
    this.errorMessage = ""; //clears msgs
    this.successMessage = "";

    try {
      await this.authService.forgotPassword(this.usernameOrEmail); //calls forgotPassword() in AuthService
      //if successful:
      this.isLoading = false;
      this.successMessage = "Password reset email sent! Please check your inbox.";
      this.usernameOrEmail = ""; // clear input
      // if unsuccessful:
    } catch (err: any) {
      this.isLoading = false;
      if (err.code === "auth/user-not-found" || err.error?.error === "User not found") {
        this.errorMessage = "No account found with that username or email";
      } else if (err.code === "auth/invalid-email") {
        this.errorMessage = "Invalid email address";
      } else {
        this.errorMessage = err.message || "Failed to send reset password email. Please try again.";
      }
    }
  }
}