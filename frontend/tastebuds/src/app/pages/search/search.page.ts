import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; //*ngFor
import { FormsModule } from '@angular/forms'; //[(ngModel)]
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http'; //http rew to search aPI
import { lastValueFrom } from 'rxjs'; //await
import { addIcons } from 'ionicons';
import { searchOutline, personCircleOutline } from 'ionicons/icons';
import {
  IonContent, IonHeader, IonToolbar, IonTitle,
  IonSearchbar, IonSpinner, IonIcon
} from '@ionic/angular/standalone';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-search',
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    IonContent, IonHeader, IonToolbar, IonTitle,
    IonSearchbar, IonSpinner, IonIcon
  ]
})
export class SearchPage {

  searchQuery = '';           // what user types
  searchResults: any[] = []; // list of users returned
  isLoading = false;
  hasSearched = false;        // true after first search

  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    addIcons({ searchOutline, personCircleOutline });
  }

  // Runs when user types in search bar
  async onSearch(event: any) {
    const query = event.detail.value?.trim(); //gets current text from search bar and removes white space from both ends
    this.searchQuery = query; //updates serachQuery with current input

    await this.searchUsers(query);
  }

  async searchUsers(query: string) {
    this.isLoading = true; //shows spinner
    this.hasSearched = true; //no results msg can show if needed

    try {
      const response: any = await lastValueFrom(
        this.http.get(`${this.apiUrl}/search/?q=${query}`) //sends GET /api/users/search/?q=chen to django, ex q=chen - query parameter passed to Django
        //DJnago searches for users whose username or display name contains chen
      );
      this.searchResults = response; //stores results
      this.isLoading = false; //hides spinner
    } catch (err) {
      console.error('Failed to search users', err);
      this.isLoading = false;
    }
  }

  // Navigate to user's profile
  onUserClick(username: string) {
    this.router.navigate(['/tabs/profile', username]);
  }
}