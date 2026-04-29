import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // *ngIf, *ngFot
import { RouterModule, ActivatedRoute, Router } from '@angular/router'; //activate route = get post id from URL
import { HttpClient } from '@angular/common/http'; // for api reqs
import { lastValueFrom } from 'rxjs'; //converts observable to promise
import { addIcons } from 'ionicons';
import { arrowBackOutline, heart, heartOutline, chatbubbleOutline, bookmarkOutline, trashOutline, timeOutline, peopleOutline, speedometerOutline, restaurantOutline, locationOutline, cashOutline} from 'ionicons/icons';
import {
  IonContent, IonHeader, IonToolbar, IonTitle,
  IonButtons, IonButton, IonIcon, IonSpinner
} from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth'; 
import { environment } from '../../../environments/environment';
import { Location } from '@angular/common';

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

  // LIKE VARIABLES
  isLiked = false; //true if logged in user has liked this post
  likesCount = 0; //total number of likes
  isLiking = false; //prevents double tapping

  private apiUrl = environment.apiUrl; //from env file
  private interactionsUrl = environment.apiUrl.replace('/users', '/interactions'); //base url pointing to users app replace usrs part of url w/ interactions

  constructor(
    private route: ActivatedRoute,  //gets post id from URL
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
    private location: Location //so we can go backt to previous page
  ) {
    addIcons({ arrowBackOutline, heart, heartOutline, chatbubbleOutline, bookmarkOutline, trashOutline, timeOutline, peopleOutline, speedometerOutline, restaurantOutline, locationOutline, cashOutline });
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
      this.likesCount = response.likes_count; // gets initial like count from post data

      // Check if this is the logged in user's post
      const currentUser = this.authService.getCurrentUser();
      this.isOwnPost = currentUser?.username === this.post.username; //compares usernames
      //if it is the logged in user's post then the delete btn is displayed

      // When post loads check if current user likes it so heart shows correct state
      await this.loadLikeStatus(); 

      this.isLoading = false;
    } catch (err) {
      console.error('Failed to load post', err);
      this.isLoading = false;
    }
  }

  // CHECK IF LIKED
  async loadLikeStatus() {
    try {
      const token = await this.authService.getValidToken();
      const response: any = await lastValueFrom(
        // sends GET request to (example)/api/interactions/likes/5/ django checks if user liked the post 
        this.http.get(`${this.interactionsUrl}/likes/${this.postId}/`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      );
      //returns 
      this.isLiked = response.is_liked; // true or false
      this.likesCount = response.likes_count; // most up to date count

    } catch (err) {
      console.error('Failed to load like status', err);
    }
  }

  // TOGGLE LIKE / UNLIKE
  async onToggleLike() {
    if (this.isLiking) return; // prevents spam tapping, if api call is in progress, immediately exits function and ignores like tap 
    // Sets Lock
    this.isLiking = true; // no more taps will go thru until set to false

    // saves current state before changing anything, used to go back if api call fails (backup)
    const previousIsLiked = this.isLiked;
    const previousCount = this.likesCount;

    // updates UI instantly before api responds
    this.isLiked = !this.isLiked;
    this.likesCount += this.isLiked ? 1 : -1; //checks isLiked value, if liked add 1 to count, if uunliked minus 1

    try {
      const token = await this.authService.getValidToken();

      if (previousIsLiked) { //uses previousIsLiked (backuo) to decide which API call to make (cuz this.isLiked has been flipped for UI)

        // If it was liked before sends DELETE /api/interactions/unlike/5/ to unlike
        await lastValueFrom(
          // http.delete only requires 2 arguments ( url & options ) cuz DELETE reqs never have a body
          this.http.delete(`${this.interactionsUrl}/unlike/${this.postId}/`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        );
  
      } else {
        // If it wasn't liked before then sends POST /api/interactions/like/5/ to like
        await lastValueFrom(
          // http.post always expects 3 arguments (url, request body (data you want to send), options (like headers)), we dont have any data to send cuz django just needs to know who is liking th epost (already knwos from JWT token) so we pass {} (empty object)
          this.http.post(`${this.interactionsUrl}/like/${this.postId}/`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          })
        );
      }
    } catch (err) {
      // If API call fails, revert back to previous state
      console.error('Failed to toggle like', err);
      this.isLiked = previousIsLiked;
      this.likesCount = previousCount;

    } finally { //finally runs whether api call succeeds or fails
      this.isLiking = false; //releases the lock, always re-enables liking even if error
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
    this.location.back();
  }
}