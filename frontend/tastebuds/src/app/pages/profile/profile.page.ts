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

  private apiUrl = environment.apiUrl; //base URL for backend API, used in all API calls in this component

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
      await this.loadPosts();

      //Check if this is the logged in user's profile
      const currentUser = this.authService.getCurrentUser();
      const currentUsername = currentUser?.username?.trim().toLowerCase();
      const profileUsername = this.username?.trim().toLowerCase();

      this.isOwnProfile = currentUsername === profileUsername;

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

  // Switching between tabs
  setTab(tab: string) {
    this.activeTab = tab;
  }

  //Navigate to edit profile page
  onEditProfile() {
    this.router.navigate(['/edit-profile']);
  }

  // Follow/Unfollow
  onToggleFollow() {
    this.isFollowing = !this.isFollowing;
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
