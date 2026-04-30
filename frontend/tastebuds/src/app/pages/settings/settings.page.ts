import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { addIcons } from 'ionicons';
import { arrowBackOutline, trashOutline } from 'ionicons/icons';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon } from '@ionic/angular/standalone';
import { AlertController } from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth';
import { environment } from '../../../environments/environment';
import { Location } from '@angular/common';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon]
})
export class SettingsPage {

  private apiUrl = environment.apiUrl;

  constructor(
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
    private alertController: AlertController,
    private location: Location
  ) {
    addIcons({ arrowBackOutline, trashOutline });
  }

  // DELETE ACCOUNT
  async onDeleteAccount() {
    const alert = await this.alertController.create({
      header: "Delete Account",
      message: "Are you sure you want to delete your account? This cannot be undone and all your posts, comments and data will be permanently deleted.",
      buttons: [
        {
          text: "Cancel",
          role: "cancel"
        },
        {
          text: "Delete",
          role: "destructive",
          cssClass: "alert-delete-btn",
          handler: async () => {
            try {
              const token = await this.authService.getValidToken();
              await lastValueFrom(
                // DELETE /api/users/delete-account/
                this.http.delete(`${this.apiUrl}/delete-account/`, {
                  headers: { Authorization: `Bearer ${token}` }
                })
              );
              // logout and redirect to login after deletion
              await this.authService.logout();
              this.router.navigate(['/login']);
            } catch (err) {
              console.error('Failed to delete account', err);
            }
          }
        }
      ]
    });
    await alert.present();
  }

  // back to profile page
  onBack() {
    this.location.back();
  }
}