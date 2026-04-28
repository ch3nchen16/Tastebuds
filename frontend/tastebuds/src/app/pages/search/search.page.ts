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

  searchQuery = '';   // what user types
  userResults: any[] = []; // array: list of users returned
  postResults: any[] = []; //ppost search results 
  isLoading = false; //spinner
  hasSearched = false;  // true after first search

  private apiUrl = environment.apiUrl; //private api in env file
  // converts users api url to posts api url to fetch all posts for seraching
  private postsUrl = environment.apiUrl.replace('/users', '/posts'); 
  

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

    if (!query) { // clears result arrays when search is empty
      this.userResults = [];
      this.postResults = [];
      this.hasSearched = false;
      return;
    }

    await this.search(query);
  }

  async search(query: string) {
    this.isLoading = true; //shows spinner
    this.hasSearched = true; //no results msg can show if needed

    try {
      //search users and posts
      const [usersResponse, postsResponse]: any[] = await Promise.all([ //Promise.all runs both requests at same time
        lastValueFrom(this.http.get(`${this.apiUrl}/search/?q=${query}`)),
        //sends GET /api/users/search/?q=chen to django, ex q=chen - query parameter passed to Django
        //Djnago searches for users whose username or display name contains chen
        lastValueFrom(this.http.get(`${this.postsUrl}/`))
      ]);

      //stores user results from Django's search endpoint
      this.userResults = usersResponse; 

      // Filter posts by search query
      const queries = query.toLowerCase().trim().split(' ').filter(q => q.length > 0); //filter(q => q.length > 0) removes empty strings from extra spaces
      // splits "italian vegan" into ["italian", "vegan"]

      this.postResults = postsResponse.filter((p: any) => {
       //filter() loops thru all posts and keeps only matching ones

      return queries.every(q => { // Every word in the query must match a field
        if (p.caption?.toLowerCase().includes(q)) return true; //? handles null values
        if (p.cuisine_type?.toLowerCase().includes(q)) return true;
        if (p.username?.toLowerCase().includes(q)) return true;

        if (p.review?.restaurant_name?.toLowerCase().includes(q)) return true;
        if (p.review?.location?.toLowerCase().includes(q)) return true;
        //.some() returns true if any item in array matches
        if (p.review?.diet_option?.some((d: string) => d.toLowerCase().includes(q))) return true; 
        if (p.review?.dining_type?.some((d: string) => d.toLowerCase().includes(q))) return true;

        if (p.recipe?.diet_req?.some((d: string) => d.toLowerCase().includes(q))) return true;
        if (p.recipe?.ingredients?.some((i: any) => i.ingredient_name?.toLowerCase().includes(q))) return true;
        if (p.recipe?.instructions?.toLowerCase().includes(q)) return true;
    return false;
      });
    });

      this.isLoading = false; //hides spinner

    } catch (err) {
      console.error('Failed to search users/posts', err);
      this.isLoading = false;
    }
  }

  // Navigate to user's profile
  onUserClick(username: string) {
    this.router.navigate(['profile', username]);
  }
   
  // Navigate to post 
  onPostClick(postId: number) {
    this.router.navigate(['/post', postId]);
  }
}