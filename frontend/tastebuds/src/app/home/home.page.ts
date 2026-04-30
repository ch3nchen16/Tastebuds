import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';// *ngIf *ngFor
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs'; //await
import { FormsModule } from '@angular/forms'; // [(ngModel)]
import { addIcons } from 'ionicons';
import { personCircleOutline, copyOutline, timeOutline, locationOutline, peopleOutline, restaurantOutline, notificationsOutline } from 'ionicons/icons';
import {
  IonContent, IonHeader, IonToolbar, IonSpinner,
  IonIcon, IonRefresher, IonRefresherContent,
  IonButton, IonBadge
} from '@ionic/angular/standalone';
import { AuthService } from '../services/auth';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    IonContent, IonHeader, IonToolbar, IonSpinner,
    IonIcon, IonRefresher, IonRefresherContent, 
    IonButton, IonBadge
  ] //ionRefresherContent enables pull to refresh
})
export class HomePage {

  // TABS can be tastebuds or for you, defaults to  for you
  activeTab: 'tastebuds' | 'foryou' = 'foryou'; 

  // FILTER PILLS defaults to all
  activeFilter: 'all' | 'recipe' | 'review' = 'all';

  // POSTS
  allPosts: any[] = []; //stores all posts (for 'for you' tab)
  followingPosts: any[] = []; //stores posts from people you follow
  isLoading = false; //spinner
  unreadCount = 0; // stores unread notif count 

  private interactionsUrl = environment.apiUrl.replace('/users', '/interactions');
  //both from environment url by replacing /users with correct path 
  private postsUrl = environment.apiUrl.replace('/users', '/posts');

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {
    addIcons({ personCircleOutline, copyOutline, timeOutline, locationOutline, peopleOutline, restaurantOutline, notificationsOutline });
  }

  //runs every time home page becomes visible
  async ionViewWillEnter() { 
    await this.loadPosts();
    // loads unread count every time home page is visible
    await this.loadUnreadCount(); 
  }

  // DISPLAY  POSTS
  async loadPosts() {

    this.isLoading = true; //spinner shows

    try {
      // Load all posts for For You tab
      const allResponse: any = await lastValueFrom(
        this.http.get(`${this.postsUrl}/`)
      );
      this.allPosts = allResponse; // stores them in allPosts

      // Load following posts for TasteBuds tab
      const token = await this.authService.getValidToken();
      if (token) {
        try {
          const followingResponse: any = await lastValueFrom(
            this.http.get(`${this.interactionsUrl}/following-posts/`, {
              headers: { Authorization: `Bearer ${token}` }
            })
          );
          this.followingPosts = followingResponse;
        } catch {
          this.followingPosts = [];
        }
      }

      this.isLoading = false;
    } catch (err) {
      console.error('Failed to load posts', err);
      this.isLoading = false;
    }
  }

  // UNREAD NOTIFICATION COUNT
  async loadUnreadCount() {
    try {
      // requires auth 
      const token = await this.authService.getValidToken();
      const response: any = await lastValueFrom(
        // sends GET to /api/interactions/notifications/unread-count/ Django counts all unread notifs
        this.http.get(`${this.interactionsUrl}/notifications/unread-count/`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      );
      // django returns number of unread notifs 
      this.unreadCount = response.unread_count;
    } catch (err) {
      console.error('Failed to load unread count', err);
    }
  }

  // GET POSTS FOR CURRENT TAB
  get currentPosts(): any[] {
    const posts = this.activeTab === 'tastebuds' ? this.followingPosts : this.allPosts;
    return this.applyFilters(posts);
  }

  // APPLY FILTER PILLS 
  applyFilters(posts: any[]): any[] {
    let result = [...posts]; //creates copy of array so er don't modify original

    // Filter by post type
    if (this.activeFilter === 'recipe') {
      result = result.filter(p => p.post_type === 'recipe');
    } else if (this.activeFilter === 'review') {
      result = result.filter(p => p.post_type === 'review');
    }

    return result;
  }

  // TAB SWITCH
  setTab(tab: 'tastebuds' | 'foryou') {
    this.activeTab = tab;
    this.activeFilter = 'all';
  }

  // FILTER SWITCH
  setFilter(filter: 'all' | 'recipe' | 'review') {
    this.activeFilter = filter;
  }

  // PULL TO REFRESH
  async onRefresh(event: any) {
    await this.loadPosts();
    event.target.complete();
  }

  // NAVIGATE TO POST
  onPostClick(postId: number) {
    this.router.navigate(['/post', postId]);
  }

  // NAVIGATE TO NOTIFICATIONS PAGE
  onNotifications() {
    this.router.navigate(['/notifications']);
  }

  // NAVIGATE TO PROFILE
  onUserClick(username: string) {
    this.router.navigate(['/profile', username]);
  }
}