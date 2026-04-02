import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { addIcons } from 'ionicons';
import { logOutOutline, settingsOutline, personCircleOutline } from 'ionicons/icons';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon } from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, RouterModule, FormsModule, IonButtons, IonButton, IonIcon]
})
export class ProfilePage implements OnInit {

  user: any = null; //stores user data from Django
  username = ""; 
  isOwnProfile = false; //true if viewing your own profile
  isFollowing = false; //true if you follow this user
  activeTab = "all"; // all/revies/recipes
  posts: any[] = []; //list of posts to display based on active tab

  private apiUrl = "http://127.0.0.1:8000/api/users";

  constructor(
    private route: ActivatedRoute, //to get username from URL
    private router: Router,  //to navigate to other pages
    private http: HttpClient, //to make API calls
    private authService: AuthService //to get current user info and auth token
  ) { 
    addIcons({ logOutOutline, settingsOutline, personCircleOutline }); 
  }

  async ngOnInit() {
  
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
      this.isOwnProfile = currentUser?.username === this.username;

    } catch (err) {
      console.error("Failed to load profile", err)
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

}
