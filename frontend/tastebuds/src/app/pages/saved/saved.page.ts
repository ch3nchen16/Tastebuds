import { Component } from '@angular/core'; 
import { CommonModule } from '@angular/common'; //*ngIf *ngFor
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http'; //await
import { lastValueFrom } from 'rxjs';
import { addIcons } from 'ionicons';
import { playCircleOutline, copyOutline, bookmarkOutline } from 'ionicons/icons';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonSpinner, IonIcon } from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-saved',
  templateUrl: './saved.page.html',
  styleUrls: ['./saved.page.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, IonContent, IonHeader, IonTitle, IonToolbar, IonSpinner, IonIcon]
})
export class SavedPage {

  savedPosts: any[] = []; // all saved posts fetched from django, filled by loadsavedPosts(), html looks thru this to display the posts grid
  activeTab = 'all'; // tracks which tab is active (all/recipes/reviews) defaults to all
  isLoading = false; //spinner 

  // base url but replaces users with interactions 
  private interactionsUrl = environment.apiUrl.replace('/users', '/interactions');

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {
    addIcons({ playCircleOutline, copyOutline, bookmarkOutline });
  }

  // runs every time saved page becomes visible
  async ionViewWillEnter() {
    // it will reload and show updated list of posts
    await this.loadSavedPosts();
  }

  // LOAD SAVED POSTS
  async loadSavedPosts() {
    //spinner shows
    this.isLoading = true;
    try {
      const token = await this.authService.getValidToken();
      const response: any = await lastValueFrom(
        // sends GET to /api/interactions/saved-posts/, django returns all saved posts
        this.http.get(`${this.interactionsUrl}/saved-posts/`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      );
      this.savedPosts = response;
      this.isLoading = false;
    } catch (err) {
      console.error('Failed to load saved posts', err);
      this.isLoading = false;
    }
  }

  // FILTER POSTS BASED ON ACTIVE TAB
  get filteredPosts() {
    if (this.activeTab === 'recipes') return this.savedPosts.filter(p => p.post_type === 'recipe');
    if (this.activeTab === 'reviews') return this.savedPosts.filter(p => p.post_type === 'review');
    return this.savedPosts; // all
  }

  // SWITCH TABS
  setTab(tab: string) {
    this.activeTab = tab;
  }

  // NAVIGATE TO POST DETAIL
  onPostClick(postId: number) {
    this.router.navigate(['/post', postId]);
  }
}