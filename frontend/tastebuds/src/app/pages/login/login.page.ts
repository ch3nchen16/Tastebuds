import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; //enables *ngIf
import { FormsModule } from '@angular/forms'; //enables [(ngModel)]
import { IonContent, IonInput, IonSpinner, IonButton} from '@ionic/angular/standalone';
import { AuthService} from '../../services/auth'; //import auth service to use login method that talks to Django
import { RouterModule, Router, ActivatedRoute } from '@angular/router'; //import router to go to other pages after login
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-login',  
  templateUrl: './login.page.html', //which html file to use
  styleUrls: ['./login.page.scss'], //css file to use
  standalone: true, 
  imports: [IonContent, IonInput, IonSpinner, IonButton, CommonModule, FormsModule, RouterModule],
})
export class LoginPage {

  //properties: variables that connect to the html (via *ngIf & ngModel)
  username = "";
  password = "";
  isLoading = false; //for showing loading spinner when user clicks btn
  errorMessage = "";
  successMessage = ""; //for showing success message when user is redirected from register page
  showResendButton = false; 

  //constructor injects these services so we can call login() & navigate
  constructor(private authService: AuthService, private router: Router, private route: ActivatedRoute) {
    // Check if user just registered and needs to verify email
    this.route.queryParams.subscribe(params => {
      if (params["message"]) {
        this.successMessage = params["message"];
      }
    });
  }

  async onLogin() {
    //if username or password is empty 
    if (!this.username || !this.password) {
      this.errorMessage = "Please enter all fields";
      return;
    }

    this.isLoading = true; //once true: spinner appears and btn disabled
    this.errorMessage = ""; //clears error msg

    try {
      await this.authService.login(this.username, this.password);
      this.isLoading = false;
      this.username = "";
      this.password = "";
      this.router.navigate(["/home"]);
    } catch (err: any) {
      this.isLoading = false;
      if (err.message === "Please verify your email before logging in") {
        this.errorMessage = "Please verify your email before logging in";
        this.showResendButton = true; //shows the "Resend Verification Email" btn after user doesnt verify 
      } else if (err.code === "auth/invalid-credential") {
        this.errorMessage = "Invalid username or password";
        this.showResendButton = false; //hides resend btn
      } else if (err.code === "auth/too-many-requests") {
        this.errorMessage = "Too many attempts. Please try again later";
        this.showResendButton = false;
      } else {
        this.errorMessage = err.message || "Login failed. Please try again.";
        this.showResendButton = false;
      }
    }
  }

  async onResendVerification() {
    try {
    // We need email so get it from Django if username was used
    let email = this.username;
    if (!this.username.includes("@")) {
      const userResponse: any = await lastValueFrom(
        this.authService.getEmailByUsername(this.username)
      );
      email = userResponse.email; 
    }
    await this.authService.resendVerificationEmail(email, this.password);
    this.errorMessage = "";
    this.successMessage = "Verification email sent! Please check your inbox.";
    this.showResendButton = false;
    this.password = ""; //clear pw field
    } catch (err: any) {
      this.errorMessage = "Failed to resend verification email. Please try again.";
    }
  }
}
