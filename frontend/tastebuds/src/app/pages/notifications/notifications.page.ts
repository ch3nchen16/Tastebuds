import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { addIcons } from 'ionicons';
import { arrowBackOutline, personCircleOutline } from 'ionicons/icons';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonSpinner, IonButton, IonButtons, IonIcon } from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth';
import { environment } from '../../../environments/environment';
import { Location } from '@angular/common';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IonContent, IonHeader, IonTitle, IonToolbar, IonSpinner, IonButton, IonButtons, IonIcon]
})
export class NotificationsPage {

  // notifications from today 
  todayNotifications: any[] = [];  
  // notifications from last 7 days
  lastWeekNotifications: any[] = [];
  // spinner  
  isLoading = false;
  // controls show more button
  showMoreLastWeek = false; 
  // number of notifications to show before show more            
  initialLimit = 5;                     

  private interactionsUrl = environment.apiUrl.replace('/users', '/interactions');

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService,
    private location: Location
  ) {
    addIcons({ arrowBackOutline, personCircleOutline });
  }

  async ionViewWillEnter() {
    await this.loadNotifications();
  }

  // LOAD NOTIFICATIONS
  async loadNotifications() {
    this.isLoading = true;
    try {
      const token = await this.authService.getValidToken();
      const response: any = await lastValueFrom(
        // GET /api/interactions/notifications/
        this.http.get(`${this.interactionsUrl}/notifications/`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      );
      // Django returns all notifs
      this.todayNotifications = response.today;
      this.lastWeekNotifications = response.last_7_days;

      // IMMEDIATELY MARKS ALL NOTIFS AS READ AFTER NOTIFS LOAD
      await lastValueFrom(
        // PUT /api/interactions/notifications/read/
        this.http.put(`${this.interactionsUrl}/notifications/read/`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
      );

      this.isLoading = false;
    } catch (err) {
      console.error('Failed to load notifications', err);
      this.isLoading = false;
    }
  }

  // RETURNS LAST WEEK NOTIFICATIONS based on showMoreLastWeek
  get visibleLastWeekNotifications(): any[] {
    // if user clicks show more 
    if (this.showMoreLastWeek) {
      return this.lastWeekNotifications; // show all
    }
    // show only first 5
    return this.lastWeekNotifications.slice(0, this.initialLimit); 
  }

  // NAVIGATE TO POST when notification is tapped
  onNotificationClick(notification: any) {
    if (notification.notification_type === 'follow') {
        // follow notification = navigate to sender's profile
        this.router.navigate(['/profile', notification.sender_username]);
    } else if (notification.notification_type === 'reply' && notification.comment_id) {
        // like, comment, reply notification = navigate to post or comment
        this.router.navigate(['/post', notification.post_id], {
          queryParams: { commentId: notification.comment_id }
        });
    } else if (notification.notification_type === 'comment' && notification.comment_id) {
        // navigate to post and scroll to the specific comment
        this.router.navigate(['/post', notification.post_id], {
            queryParams: { commentId: notification.comment_id }
        });
    } else if (notification.post_id) {
        this.router.navigate(['/post', notification.post_id]);
    }
}

  onBack() {
    this.location.back();
  }
}