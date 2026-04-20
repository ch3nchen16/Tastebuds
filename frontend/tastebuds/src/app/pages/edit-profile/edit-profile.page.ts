import { Component, OnInit, ViewChild } from '@angular/core'; //ViewChild = allows us to get a reference to a HTML element in the template (we use it to access hidden file input for photo uploads in browser)
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { addIcons } from 'ionicons';
import { personCircleOutline, cameraOutline } from 'ionicons/icons';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons, IonIcon, IonInput, IonTextarea, IonSpinner, IonActionSheet } from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth';
import { Capacitor } from '@capacitor/core'; //for Capacitor.getPlatform() used to detect  whether app is running on web, ios or android
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'; //this plugin gives IOnic access to device's camera & camera roll 
//CameraResultType= specifies format on how to return photo (Base64), CameraSource = specifies where to get photo from (camera or camera roll)
//run npm install @capacitor/camera to install it and then ionic build then run npx cap sync to sync it with the native projects (ios and android) so we can use it in our code
import { CloudinaryService } from '../../services/cloudinary.service'; //service to handle uploading media to Cloudinary
import { environment } from '../../../environments/environment'; //to get API URL from environment file

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.page.html',
  styleUrls: ['./edit-profile.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons, IonIcon, IonInput, IonTextarea, IonSpinner, IonActionSheet],
})
export class EditProfilePage implements OnInit {

  // Form Fields/ class properties, all empty until loadCurrentUser() runs
  displayName = "";
  username = "";
  bio = "";
  phone = "";
  profilePicture = "";

  isLoading = false;
  isUploadingPhoto = false; //for showing spinner while uploading media
  errorMessage = "";
  showActionSheet = false; //controls photo picker action sheet 

  @ViewChild('fileInput') fileInput: any; //reference to hidden file input for browser photo uploads

  //Options for user to choose when adding a pfp
  actionSheetButtons = [
    {
      text: "Take Photo",
      handler: () => this.pickImage(CameraSource.Camera) 
    },
    {
      text: "Chooser from Camera Roll",
      handler: () => this.pickImage(CameraSource.Photos )
    },
    {
      text: "Cancel",
      role: "cancel"
    }
  ];

  private apiUrl = environment.apiUrl; //private url for all API calls (only this component can access it)

  constructor( //injects these so we can use them
    private router: Router,
    private authService: AuthService,
    private http: HttpClient,
    private cloudinary: CloudinaryService
  ) { 
    addIcons({ personCircleOutline, cameraOutline });
  }

  async ngOnInit() { //runs when page loads. Calls loadCurrentUser() to pre-fill form w/ user's existing data
    await this.loadCurrentUser();
  }

  async loadCurrentUser() {
    try{
      const token = this.authService.getToken(); //gets JWWT access tiken from local storage - needed to prove to Djano that user is logged in
      const response: any = await lastValueFrom (  //waits for Django to respons before continuing
        this.http.get(`${this.apiUrl}/me/`, {  //sends GET req to /api/users/me/ (remember private url)
          headers: {Authorization: `Bearer ${token}`} // Bearer = standard prefix for JWT tokens and is included in authorization header
        }) //when making a req to Django u need to show who is making the req and Authorization header is like the ID card, then Django reads it and verifies the token
      ); //bearer because the person bearing this token is who they claim to be

      // the token itsels is a long string that contains the header, payload (user data) and signature (proof it hasnt been tamoered)

      //Pre-fill form w/ existing data
      this.displayName = response.display_name || "";
      this.username = response.username || "";
      this.bio = response.bio || "";
      this.phone = response.phone || "";
      this.profilePicture = response.profile_picture || "";
    } catch (err) {
      console.error("Failed to load user", err);
    }
  }

  onChangePicture() {
    // Check if running in browser or on device
    if (this.isPlatformWeb()) {
      this.fileInput.nativeElement.click(); // open file picker in browser
    } else {
      this.showActionSheet = true; // show action sheet on device
    }
  }

  //if running in browser return true, if running on ios or android return false (used to decide whether to shoa action sheet (phone) or file picker)
  isPlatformWeb(): boolean {
    return Capacitor.getPlatform() === 'web';
  }

  //Converts selected photo to Base64 for Cloudinary Upload
  async onFileSelected(event: any) {
    const file = event.target.files[0]; //gets first selected file
    if (!file) return; //if no file selected, exit 

    const reader = new FileReader(); //built in browser APi to read files and convert them to different formats (we use it to convert the photo to Base64 so we can upload it to Cloudinary)
    reader.onload = async (e: any) => {
      const base64 = e.target.result.split(',')[1]; //removes data:image/jpeg;base64, from the beginning of the string so we just have the raw Base64 data for Cloudinary upload
      await this.uploadPhoto(base64, file.type.split('/')[1]); //for ex image/jpeg -> jpeg
    };
    reader.readAsDataURL(file);
  }


 //For both camera and camera roll, gets photo, converts to Base64 and uploads to Cloudinary
  async pickImage(source: CameraSource) {
    try {
      const image = await Camera.getPhoto({ //Capacitor's method to get a photo
        quality: 80, //compress img to 80% quality to reduce file size
        allowEditing: false, //no editing screen after taking photo
        resultType: CameraResultType.Base64, //return img as base64 string
        source: source //source either camera or camera roll depending on user choice in action sheet
      });

      //use img's format, but default to jpeg if unknown (some platforms may not provide format, but Cloudinary needs it so we default to jpeg since its most common)
      if (image.base64String) {
        await this.uploadPhoto(image.base64String, image.format ?? 'jpeg'); 
      }
    } catch (err) {
      console.error('Failed to pick image', err);
    }
  }

  // Uploading Photo
  async uploadPhoto(base64String: string, format: string) {
    this.isUploadingPhoto = true; //displays spinner 

    try {
      //sends base64 img to Cloudinary
      const url = await this.cloudinary.uploadMedia(base64String, format, 'image'); 
      this.profilePicture = url; //cloudinary URL returned after successful upload (save URL to database)

      this.isUploadingPhoto = false; //hides spinner


    } catch (err) {
      console.error('Upload failed', err);
      this.errorMessage = 'Failed to upload image. Please try again.';
      this.isUploadingPhoto = false;
    }
  }

  // Saving Edits
  async onSave() {
    this.isLoading = true; //shows spinner
    this.errorMessage = ''; //clears previous error messages

    try {
      const token = this.authService.getToken(); //gets JWT token to prove to Django that user is logged in
      await lastValueFrom( //waits for Django to respond before continuing
        this.http.put(`${this.apiUrl}/update-profile/`, { //sends PUT req to /api/users/update-profile/ 
          //updated user data to update in Django database
          display_name: this.displayName,
          bio: this.bio,
          phone: this.phone,
          profile_picture: this.profilePicture
        }, {
          headers: { Authorization: `Bearer ${token}` } //includes JWT token in authorization header so Django knows who is making the req and can verify they are logged in
        })
      );

      this.isLoading = false; //hides spinner
      this.router.navigate(['/tabs/profile']); //back ti profile page

    } catch (err: any) {
      this.isLoading = false;
      this.errorMessage = 'Failed to save changes. Please try again.';
    }
  }

  onCancel() {
    this.router.navigate(['/tabs/profile']);
  }

  
}
