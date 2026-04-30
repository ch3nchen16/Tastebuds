import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; //*ngIf
import { FormsModule } from '@angular/forms'; // [(ngModel)]
import { RouterModule, ActivatedRoute, Router } from '@angular/router'; //ActivatedRoute gets username from url e.g /followers/testuser gives username = "testuser"
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs'; //await
import { addIcons } from 'ionicons';
import { arrowBackOutline, personCircleOutline } from 'ionicons/icons';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth';
import { environment } from '../../../environments/environment';
import { Location } from '@angular/common'; // to go gack to previous page

@Component({
  selector: 'app-following',
  templateUrl: './following.page.html',
  styleUrls: ['./following.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon, IonSpinner]
})
export class FollowingPage implements OnInit {

  following: any[] = []; // list of following, filled by loadFollowing(), html loops thru this to display each user
  username = ''; // whose followers we are viewing, if you are viewing another user's followers
  isLoading = false; // spinner

  // uses base url to buidl interactions api url
  private interactionsUrl = environment.apiUrl.replace('/users', '/interactions');

  constructor(
    private route: ActivatedRoute,  // to get username from URL
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
    private location: Location
  ) {
    addIcons({ arrowBackOutline, personCircleOutline });
  }

  async ngOnInit() {
    // gets username from URL e.g /following/testuser
    this.username = this.route.snapshot.paramMap.get('username') || '';
    //loads following list
    await this.loadFollowing();
  }

  // LOAD FOLLOWERS
  async loadFollowing() {
    this.isLoading = true; // shows spinner
    try {
      const token = await this.authService.getValidToken();
      const response: any = await lastValueFrom(
        // GET /api/interactions/following/testuser/ django returns list of followe objects
        this.http.get(`${this.interactionsUrl}/following/${this.username}/`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      );
      this.following = response;

      this.isLoading = false; // hides spinner
    } catch (err) {
      console.error('Failed to load followers', err);
      this.isLoading = false;
    }
  }

  // navigate to following's profile
  onUserClick(username: string) {
    this.router.navigate(['/profile', username]);
  }

  // BACK TO PREVIOUS PAGE
  onBack() {
    this.location.back();
  }
}