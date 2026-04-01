import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; //enables *ngIf
import { FormsModule } from '@angular/forms'; //enables [(ngModel)]
import { IonContent, IonInput, IonSpinner, IonButton} from '@ionic/angular/standalone';
import { AuthService} from '../../services/auth'; //import auth service to use login method that talks to Django
import { RouterModule, Router } from '@angular/router'; //import router to go to other pages after login

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

  //constructor injects these services so we can call login() & navigate
  constructor(private authService: AuthService, private router: Router) { }

  onLogin() {
    //if username or password is empty 
    if (!this.username || !this.password) {
      this.errorMessage = "Please enter all fields";
      return;
    }

    this.isLoading = true; //once true: spinner appears and btn disabled
    this.errorMessage = ""; //clears error msg
    //calls authService.login() & subscribes to the result 
    this.authService.login(this.username, this.password).subscribe({
      next: () => { //runs when Django responds successfully
        this.isLoading = false; //stop loading
        this.router.navigate(["/home"]); //navigate to home
      },
      error: (err) => { //runs when unsuccessful
        this.isLoading = false; //stop loading & show error msg
        this.errorMessage = err.error?.error || "Login failed. Please try again";
      }
    });
  }

}
