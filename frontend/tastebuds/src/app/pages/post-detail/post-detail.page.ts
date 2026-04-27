import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // *ngIf, *ngFot
import { RouterModule, ActivatedRoute, Router } from '@angular/router'; //activate route = get post id from URL
import { HttpClient } from '@angular/common/http'; // for api reqs
import { lastValueFrom } from 'rxjs'; //converts observable to promise
import { addIcons } from 'ionicons';
import { arrowBackOutline, heartOutline, chatbubbleOutline, bookmarkOutline, trashOutline, timeOutline, peopleOutline, speedometerOutline, restaurantOutline, locationOutline, cashOutline} from 'ionicons/icons';
import {
  IonContent, IonHeader, IonToolbar, IonTitle,
  IonButtons, IonButton, IonIcon, IonSpinner
} from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth'; 
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-post-detail',
  templateUrl: './post-detail.page.html',
  styleUrls: ['./post-detail.page.scss'],
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    IonContent, IonHeader, IonToolbar, IonTitle,
    IonButtons, IonButton, IonIcon, IonSpinner
  ]
})
export class PostDetailPage implements OnInit {

  post: any = null; //stores the full post data
  isLoading = true; //shows spinner
  isOwnPost = false; //true if this is the logged in user's post so we can hide delete btn
  postId: number = 0; //stores post ID from URL, starts as 0 but sets in ngOnInit()

  private apiUrl = environment.apiUrl; //from env file

  constructor(
    private route: ActivatedRoute,  //gets post id from URL
    private router: Router,
    private http: HttpClient,
    private authService: AuthService
  ) {
    addIcons({ arrowBackOutline, heartOutline, chatbubbleOutline, bookmarkOutline, trashOutline, timeOutline, peopleOutline, speedometerOutline, restaurantOutline, locationOutline, cashOutline });
  }

  // GETS POST ID FROM URL
  async ngOnInit() {
    this.postId = Number(this.route.snapshot.paramMap.get('id')); //reads id from URL , snapshot = one time read of current URL params
    await this.loadPost();
  }

  //DISPLAY POSTS
  async loadPost() {

    //Converts users API URL to post API URL
    try {
      const postsUrl = this.apiUrl.replace('/users', '/posts');
      const response: any = await lastValueFrom( //sends GET req to /api/posts/5/ then Djnago returns full post data
        this.http.get(`${postsUrl}/${this.postId}/`)
      );
      this.post = response; //stores response in post so HTML can display

      // Check if this is the logged in user's post
      const currentUser = this.authService.getCurrentUser();
      this.isOwnPost = currentUser?.username === this.post.username; //compares usernames
      //if it is the logged in user's post then the delete btn is displayed

      this.isLoading = false;
    } catch (err) {
      console.error('Failed to load post', err);
      this.isLoading = false;
    }
  }

  // DELETE POST
  async onDelete() {
    try {
      const token = await this.authService.getValidToken(); //gets valid JWT token which refreshes if expired
      const postsUrl = this.apiUrl.replace('/users', '/posts');
      await lastValueFrom(
        this.http.delete(`${postsUrl}/${this.postId}/delete/`, { //sends DELETE req to /api/posts/5/delete/ w/ JWT token then django verifies token and post owner then deletes
          headers: { Authorization: `Bearer ${token}` }
        })
      );
      //goes back to profile page if successful
      this.router.navigate(['/tabs/profile']);
    } catch (err) {
      console.error('Failed to delete post', err);
    }
  }

  onBack() {
    this.router.navigate(['/tabs/profile']);
  }
}