import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common'; // *ngIf, *ngFot
import { RouterModule, ActivatedRoute, Router } from '@angular/router'; //activate route = get post id from URL
import { HttpClient } from '@angular/common/http'; // for api reqs
import { lastValueFrom } from 'rxjs'; //converts observable to promise
import { addIcons } from 'ionicons';
import { arrowBackOutline, heart, heartOutline, chatbubbleOutline, bookmarkOutline, trashOutline, timeOutline, peopleOutline, speedometerOutline, restaurantOutline, locationOutline, cashOutline, sendOutline, chevronDownOutline, chevronUpOutline} from 'ionicons/icons';
import {
  IonContent, IonHeader, IonToolbar, IonTitle,
  IonButtons, IonButton, IonIcon, IonSpinner, IonInput
} from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth'; 
import { environment } from '../../../environments/environment';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-post-detail',
  templateUrl: './post-detail.page.html',
  styleUrls: ['./post-detail.page.scss'],
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    IonContent, IonHeader, IonToolbar, IonTitle,
    IonButtons, IonButton, IonIcon, IonSpinner, 
    IonInput, FormsModule
  ]
})
export class PostDetailPage implements OnInit {

  //@ViewChild = decoratore that lets you access a child element from .ts ! = I guarantee this will exist
  @ViewChild(IonContent) content!: IonContent //direc reference to ion-content

  post: any = null; //stores the full post data
  isLoading = true; //shows spinner
  isOwnPost = false; //true if this is the logged in user's post so we can hide delete btn
  postId: number = 0; //stores post ID from URL, starts as 0 but sets in ngOnInit()

  // LIKE STATE VARIABLES/PROPERTIES
  isLiked = false; //true if logged in user has liked this post
  likesCount = 0; //total number of likes
  isLiking = false; //prevents double tapping

  // COMMENT STATE VARIABLES/PROPERTIES
  comments: any[] = []; // array that stores all comments
  newComment = ''; // what user is typing [[(ngModel)] bound to input so updates as user types
  isPostingComment = false; // spinner while posting
  isLoadingComments = false; // spinner while loading comments
  // tracks which comments have replies visible
  expandedReplies: Set<number> = new Set(); // Set is like an array but only stores unique values, stores comment ids that have replies visible  ex comment 5 and 3 have replies visible then this set contains {3, 5}
  // stores reply text for each comment by comment id
  replyText: { [key: number]: string } = {}; // dictionary stores reply text for each comment separately using comment id as a key ex reply to comment 3, it stores { 3: "your reply text" }
  // tracks posting state per comment
  isPostingReply: { [key: number]: boolean } = {}; // ex if you're replying to comment 3 { 3: true }

  private apiUrl = environment.apiUrl; //from env file
  private interactionsUrl = environment.apiUrl.replace('/users', '/interactions'); //base url pointing to users app replace usrs part of url w/ interactions

  constructor(
    private route: ActivatedRoute,  //gets post id from URL
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
    private location: Location //so we can go backt to previous page
  ) {
    addIcons({ arrowBackOutline, heart, heartOutline, chatbubbleOutline, bookmarkOutline, trashOutline, timeOutline, peopleOutline, speedometerOutline, restaurantOutline, locationOutline, cashOutline, sendOutline, chevronDownOutline, chevronUpOutline });
  }

  // GETS POST ID FROM URL
  async ngOnInit() {
    this.postId = Number(this.route.snapshot.paramMap.get('id')); //reads id from URL , snapshot = one time read of current URL params
    await this.loadPost();

    // scroll to a specific comment
    //ngOnInit() reads comment id from url
    const commentId = this.route.snapshot.queryParamMap.get('commentId');
    if (commentId) {
        //waits 100ms before running scroll code (give Angular some time to render comment elements )
        setTimeout(() => {
            this.scrollToComment(Number(commentId));
        }, 100);
    }
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
      await this.loadComments();

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

  // LOAD COMMENTS
  async loadComments() {
    try {
      // showz spinner
      this.isLoadingComments = true;

      // sends GET to ex /api/interactions/comments/5/, django returns all comments w/ nested replies
      const response: any = await lastValueFrom( 
        this.http.get(`${this.interactionsUrl}/comments/${this.postId}/`)
      );
      // stores full list of comments so HTML can loop thru and display them
      this.comments = response;
      // hides spinner
      this.isLoadingComments = false; 
    } catch (err) {
      console.error('Failed to load comments', err);
      this.isLoadingComments = false;
    }
  }

  // ADD COMMENT
  async onAddComment() {
    // ignores req if input empty or just spaces
    if (!this.newComment.trim()) return; 
    // shows spinner
    this.isPostingComment = true;

    try {
      const token = await this.authService.getValidToken();
      const response: any = await lastValueFrom(
        // POST /api/interactions/comments/5/add/
        this.http.post(`${this.interactionsUrl}/comments/${this.postId}/add/`,
          { text: this.newComment.trim() },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      );
      // adds new comment to top of list
      this.comments.unshift(response); 
      // clears input
      this.newComment = ''; 
      //hides spinner
      this.isPostingComment = false;
    } catch (err) {
      console.error('Failed to add comment', err);
      this.isPostingComment = false;
    }
  }

  // DELETE COMMENT
  async onDeleteComment(commentId: number) {
    try {
      const token = await this.authService.getValidToken();
      await lastValueFrom(
        // DELETE /api/interactions/comments/5/delete/
        this.http.delete(`${this.interactionsUrl}/comments/${commentId}/delete/`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      );
      // removes comment from list without reloading all comments
      this.comments = this.comments.filter(c => c.id !== commentId); // filter creates new array that keeps only comments whose id doesnt match deleted one
    } catch (err) {
      console.error('Failed to delete comment', err);
    }
  }

  // TOGGLE REPLIES VISIBILITY
  toggleReplies(commentId: number) {
    // checks if comment id is already in expandedReplies set
    if (this.expandedReplies.has(commentId)) {
      this.expandedReplies.delete(commentId); // if yes hide replies
    } else {
      this.expandedReplies.add(commentId); // if no, show replies
    }
  }

  // CHECK IF REPLIES ARE VISIBLE
  isRepliesExpanded(commentId: number): boolean {
    //checks if comment id is in expandedReplies set and returns true or false
    return this.expandedReplies.has(commentId); // HTML uses this to decide whether to show replies
  }

  // ADD REPLY
  async onAddReply(commentId: number) {
    // gets reply text for this specific comment
    const text = this.replyText[commentId]; 
    // validates if text is none or just whitespace
    if (!text || !text.trim()) return;
    // shows spinner
    this.isPostingReply[commentId] = true;

    try {
      const token = await this.authService.getValidToken();
      const response: any = await lastValueFrom(

        // POST /api/interactions/comments/5/replies/add/
        this.http.post(`${this.interactionsUrl}/comments/${commentId}/replies/add/`,
          { text: text.trim() },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      );

      // find searches the comments array for comment w/ this id 
      const comment = this.comments.find(c => c.id === commentId);
      if (comment) {
        // adds reply to bottom of replies list and increments count
        comment.replies.push(response); 
        comment.replies_count++;
      }

      // clears reply input for this comment
      this.replyText[commentId] = ''; 
      this.isPostingReply[commentId] = false;
      // makes sure replies are visible after posting
      this.expandedReplies.add(commentId); 
    } catch (err) {
      console.error('Failed to add reply', err);
      this.isPostingReply[commentId] = false;
    }
  }

  // DELETE REPLY
  async onDeleteReply(commentId: number, replyId: number) {
    try {
      const token = await this.authService.getValidToken();
      await lastValueFrom(
        // DELETE /api/interactions/comments/replies/3/delete/
        this.http.delete(`${this.interactionsUrl}/comments/replies/${replyId}/delete/`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      );

      // finds comment
      const comment = this.comments.find(c => c.id === commentId);
      if (comment) {
        // filters out deleted reply from replies array
        comment.replies = comment.replies.filter((r: any) => r.id !== replyId);
        comment.replies_count--;
      }
    } catch (err) {
      console.error('Failed to delete reply', err);
    }
  }

  // CHECK IF COMMENT BELONGS TO LOGGED IN USER
  isOwnComment(username: string): boolean { 
    // compares user's username w/ comment's username
    return this.authService.getCurrentUser()?.username === username;
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

  onUsernameClick(username: string) {
    this.router.navigate(['/profile', username]);
  }

  // Scroll to a comment for notif
  scrollToComment(commentId: number) {
    this.expandedReplies.add(commentId);

    setTimeout(() => {
      // searches html page for element w/ id="comment-5" (in html [id]="'comment-' + comment.id")
        const element = document.getElementById(`comment-${commentId}`);
        console.log('Element found:', element);
        console.log('offsetTop:', element?.offsetTop);
        
        if (element) {
            // 0 = x-axis position (horizontal scroll) we don't do that so it's 0,
            // -100 (y position) scroll down 100px space above comment,
            // 300 = how long scroll animation takes in ms 
            this.content.scrollToPoint(0, element.offsetTop - 100, 500);
            element.classList.add('highlighted');
            // after 2 seconds remove highlighted background
            setTimeout(() => element.classList.remove('highlighted'), 2000);
        }
    }, 100); 
}

  onBack() {
    this.location.back();
  }
}