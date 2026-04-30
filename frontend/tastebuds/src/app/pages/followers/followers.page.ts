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
  selector: 'app-followers',
  templateUrl: './followers.page.html',
  styleUrls: ['./followers.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon, IonSpinner]
})
export class FollowersPage implements OnInit {

  followers: any[] = []; // list of followers, filled by loadFollowers(), html loops thru this to dosplay each user
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
    // gets username from URL e.g /followers/testuser
    this.username = this.route.snapshot.paramMap.get('username') || '';
    //loads follower list
    await this.loadFollowers();
  }

  // LOAD FOLLOWERS
  async loadFollowers() {
    this.isLoading = true; // shows spinner
    try {
      const token = await this.authService.getValidToken();
      const response: any = await lastValueFrom(
        // GET /api/interactions/followers/testuser/ django returns list of followe objects
        this.http.get(`${this.interactionsUrl}/followers/${this.username}/`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      );
      this.followers = response;

      this.isLoading = false; // hides spinner
    } catch (err) {
      console.error('Failed to load followers', err);
      this.isLoading = false;
    }
  }

  // navigate to follower's profile
  onUserClick(username: string) {
    this.router.navigate(['/profile', username]);
  }

  // BACK TO PREVIOUS PAGE
  onBack() {
    this.location.back();
  }
}