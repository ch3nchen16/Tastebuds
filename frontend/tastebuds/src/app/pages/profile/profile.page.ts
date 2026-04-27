import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { addIcons } from 'ionicons';
import { logOutOutline, settingsOutline, personCircleOutline, copyOutline } from 'ionicons/icons';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon } from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth';
import { environment } from '../../../environments/environment'; //to get API URL from environment file

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, RouterModule, FormsModule, IonButtons, IonButton, IonIcon]
})
export class ProfilePage { //we removed OnInit because it only runs once so if you create a new post it will not run again and doesnt display
  //we changed it to ionViewWillEnter

  user: any = null; //stores user data from Django
  username = ""; 
  isOwnProfile = false; //true if viewing your own profile
  isFollowing = false; //true if you follow this user
  activeTab = "all"; // all/revies/recipes
  posts: any[] = []; //list of posts to display based on active tab
  isLoadingFollow = false;

  private apiUrl = environment.apiUrl; //base URL for backend API, used in all API calls in this component
  private interactionsUrl = environment.apiUrl.replace('/users', '/interactions');

  constructor(
    private route: ActivatedRoute, //to get username from URL
    private router: Router,  //to navigate to other pages
    private http: HttpClient, //to make API calls
    private authService: AuthService //to get current user info and auth token
  ) { 
    addIcons({ logOutOutline, settingsOutline, personCircleOutline, copyOutline }); 
  }

  async ionViewWillEnter() { //we use this isntead of ngOnInit because it runs every time the profile page is about to be visible S
  
    // Get username from URL or use logged in user's username
    this.route.params.subscribe(async params => {
      const currentUser = this.authService.getCurrentUser();
      this.username = params["username"] || currentUser?.username;

      await this.loadProfile();
    });
  }

  async loadProfile() {
    try{
      //Fetch user data from Django
      const response: any = await lastValueFrom(
        this.http.get(`${this.apiUrl}/profile/${this.username}/`)
      );
      this.user = response;
      

      //Check if this is the logged in user's profile
      const currentUser = this.authService.getCurrentUser();
      const currentUsername = currentUser?.username?.trim().toLowerCase();
      const profileUsername = this.username?.trim().toLowerCase();
      this.isOwnProfile = currentUsername === profileUsername;

      //Check follow status if viewing someone else's profile
      if (!this.isOwnProfile) {
        await this.checkIsFollowing();
      }

      await this.loadPosts();
    } catch (err) {
      console.error("Failed to load profile", err)
    }
  }

  // DISPLAYS POSTS ON PROFILE
  async loadPosts() {
    try {
    const postsUrl = this.apiUrl.replace('/users', '/posts');
    const response: any = await lastValueFrom(
      this.http.get(`${postsUrl}/user/${this.username}/`)
    );
    this.posts = response;
    } catch (err) {
      console.error('Failed to load posts', err);
    }
  }

  // Filter Posts based on active tab
  get filteredPosts() {
    if (this.activeTab === "reviews") return this.posts.filter(p => p.post_type === "review");
    if (this.activeTab === "recipes") return this.posts.filter(p => p.post_type === "recipe");
    return this.posts; // all posts
  }

  async checkIsFollowing() {
  try {
    const token = await this.authService.getValidToken(); //gets valid JWT token (refreshes if expired)
    const response: any = await lastValueFrom(  //sends GET /api/interactions/is-following/testuser/
      this.http.get(`${this.interactionsUrl}/is-following/${this.username}/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
    );
    this.isFollowing = response.is_following; //Fjnago returns is following: true or : false then updates isFollowing so btn changes
  } catch (err) {
    console.error('Failed to check follow status', err);
  }
}

async onToggleFollow() {
  this.isLoadingFollow = true; //shows spinner
  try {
    const token = await this.authService.getValidToken();
    const currentUser = this.authService.getCurrentUser();

    if (this.isFollowing) { //if following
      // Unfollow
      await lastValueFrom( //send DELETE /api/interactions/unfollow/testuser/
        this.http.delete(`${this.interactionsUrl}/unfollow/${this.username}/`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      );
      this.isFollowing = false;

      //decrease other user's follower count
      if (this.user) this.user.followers_count--;
      // decrease my followers count
      if (currentUser) {
        currentUser.following_count = (currentUser.following_count || 1) - 1;
        localStorage.setItem('user', JSON.stringify(currentUser));
      }
    } else {

      // Follow
      await lastValueFrom(
        this.http.post(`${this.interactionsUrl}/follow/${this.username}/`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
      );
      this.isFollowing = true;
      // increase the other user's follower count
      if (this.user) this.user.followers_count++;
      // increase my following count
      if (currentUser) {
        currentUser.following_count = (currentUser.following_count || 0) + 1;
        localStorage.setItem('user', JSON.stringify(currentUser));
      }
    }
    this.isLoadingFollow = false;
  } catch (err) {
    console.error('Failed follow', err);
    this.isLoadingFollow = false;
  }
}

  // Switching between tabs
  setTab(tab: string) {
    this.activeTab = tab;
  }

  //Navigate to edit profile page
  onEditProfile() {
    this.router.navigate(['/edit-profile']);
  }

  // Navigate to settings page
  onSettings() {
    this.router.navigate(['/settings']);
  }

  //Logout and route to login
  async onLogout() {
    await this.authService.logout();
    this.router.navigate(["/login"]);
  }

  // View Followers list
  onViewFollowers() {
    console.log("View followers");
  }

  // View Following list
  onViewFollowing() {
    console.log("View following");
  }

  onPostClick(postId: number) {
    this.router.navigate(['/post', postId]);
  }

}
