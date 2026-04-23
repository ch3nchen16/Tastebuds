import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { addIcons } from 'ionicons';
import { imageOutline, closeOutline, addOutline } from 'ionicons/icons';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonSpinner, IonActionSheet, IonInput, IonButtons, IonButton, IonTextarea, IonIcon } from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth';
import { CloudinaryService } from '../../services/cloudinary.service';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-create-post',
  templateUrl: './create-post.page.html',
  styleUrls: ['./create-post.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonSpinner, IonActionSheet, IonInput, IonButtons, IonButton, IonTextarea, IonIcon, CommonModule, FormsModule, RouterModule]
})
export class CreatePostPage implements OnInit {

  @ViewChild('fileInput') fileInput: any; //reference to the HTML element wit 'fileInput

  // TOGGLE BETWEEN RECIPE AND REVIEW
  postType: 'recipe' | 'review' = 'recipe'; //can only be recipe or review, defaults to recipe

  // SHARED FIELDS
  caption = "";
  cuisineType = "";
  mediaFiles: { url: string; type: 'image' | 'video' }[] = []; //an array of objects and each has url (cloudinary) and type

  // RECIPE FIELDS
  cookTime: number | null = null;
  servingSize: number | null = null;
  difficulty = "easy";
  dietReq: string[] = []; //empty array that stores diet reqs when user taps the pills
  customDietReq = ""; //stores what user types 
  ingredients: { name: string; quantity: string; unit: string }[] = [
    { name: "", quantity: "", unit: ""}
  ]; 
  // array of ingredient objects 
  instructions: string[] = ["", ""]; //array of instruction (string), starts w/ 2 empty steps

  // REVIEW FIELDS
  restaurantName = "";
  location = "";
  price = "";
  rating = 0;
  diningType: string[] = [];
  customDiningType = "";
  dietOption: string[] = [];
  customDietOption = "";

  // PRESET OPTIONS
  dietReqOptions = ["Vegan", "Vegetarian", "Halal", "Gluten-free", "Dairy-free"];
  diningTypeOptions = ["Casual", "Fine Dining", "Date Night", "Family Friendly", "Fast Food", "Cafe", "Buffet"]
  dietOptionOptions = ["Vegan", "Vegetarian", "Halal", "Gluten-free", "Dairy-free"];

  isLoading = false;
  isUploadingMedia = false;
  errorMessage = "";
  showActionSheet = false;

  // ACTION SHEET FOR CHOOSING MEDIA ON MOBILE PHONE
  actionSheetButtons = [
    {
      text: "Take Photo",
      handler: () => this.captureMedia(CameraSource.Camera, false)
    },
    {
      text: "Take Video",
      handler: () => this.captureMedia(CameraSource.Camera, true)
    },
    {
      text: "Choose from Camera Roll",
      handler: () => this.captureMedia(CameraSource.Photos, false)
    },
    {
      text: "Cancel",
      role: "cancel"
    }
  ];

  private apiUrl = environment.apiUrl; //private API url from env file

  constructor( //injects all services we need
    private router: Router,
    private authService: AuthService,
    private http: HttpClient,
    private cloudinary: CloudinaryService
  ) {
    addIcons({ imageOutline, closeOutline, addOutline });
  }

  async ngOnInit() {} //empty for now no need to load any data when page opens

  // UPDATES POST TYPE WHEN USER TOGGLES BETWEEN RECIPE OR REVIEW
  setPostType(type: "recipe" | "review") {
    this.postType = type;
  }

  // DIFFICULTY
  setDifficulty(difficulty: string) {
    this.difficulty = difficulty;
  }

  // DIET REQS (Recipe)
  toggleDietReq(option: string) {
    if (this.dietReq.includes(option)) { //checks if option is already selected
      this.dietReq = this.dietReq.filter(d => d !== option); //if yes, creates new array w/ that option removed
    } else {
      this.dietReq.push(option); //if no adds it to array
    }
  }

  // CUSTOM DIET REQ 
  addCustomDietReq() {
    if (this.customDietReq.trim()) { //removes whitespace, returns empty string is blank
      this.dietReq.push(this.customDietReq.trim());
      this.customDietReq = "" //clears input field
    }
  }

  // DINING TYPE (Review)
  toggleDiningType(option: string) {
    if (this.diningType.includes(option)) {
      this.diningType = this.diningType.filter(d => d !== option);
    } else {
      this.diningType.push(option);
    }
  }

  // CUSTOM DINING TYPE
  addCustomDiningType() {
    if (this.customDiningType.trim()) {
      this.diningType.push(this.customDiningType.trim());
      this.customDiningType = '';
    }
  }

  // DIET OPTION (review)
  toggleDietOption(option: string) {
    if (this.dietOption.includes(option)) {
      this.dietOption = this.dietOption.filter(d => d !== option);
    } else {
      this.dietOption.push(option);
    }
  }

  // CUSTOM DIET OPTION
  addCustomDietOption() {
    if (this.customDietOption.trim()) {
      this.dietOption.push(this.customDietOption.trim());
      this.customDietOption = '';
    }
  }

  // ADD INGREDIENT
  addIngredient() {
    this.ingredients.push({ name: '', quantity: '', unit: '' }); //adds new ingredient obj to array
  }

  // REMOVE INGREDIENT
  removeIngredient(index: number) {
    this.ingredients.splice(index, 1); //removes 1 item at given position
  }

  // INSTRUCTIONS
  addStep() {
    this.instructions.push('');
  }

  // REMOVE STEP
  removeStep(index: number) {
    this.instructions.splice(index, 1);
  }

  // RATING
  setRating(rating: number) {
    this.rating = rating;
  }

  // PRICE
  setPrice(range: string) {
    this.price = range;
  }

  // MEDIA
  onAddMedia() {
    if (Capacitor.getPlatform() === 'web') { //checks if running on browser
      this.fileInput.nativeElement.click(); //opens file picker
    } else {
      // on mobile - shows action sheet
      this.showActionSheet = true;
    }
  }

  // MOBILE CAMERA
  async captureMedia(source: CameraSource, isVideo: boolean) {
    //true = video, false = image
    try {
      const image = await Camera.getPhoto({
        quality: 80, //compresses to 80% quality to reduce file size
        allowEditing: false,
        resultType: CameraResultType.Base64, //returns as base64 string
        source: source
      });

      if (image.base64String) { //checks base64string exists before uploading
        this.isUploadingMedia = true; //shows spinner while uploading
        const format = image.format ?? 'jpeg'; //uses image's format, defaults to jpeg if unknown
        const url = await this.cloudinary.uploadMedia(image.base64String, format, 'image');
        this.mediaFiles.push({ url, type: 'image' }); //pushes URL and type into mediaFiles so it shows in preview
        this.isUploadingMedia = false;
      }
    } catch (err) {
      console.error('Failed to capture media', err);
      this.isUploadingMedia = false;
    }
  }

  // Browser File Picker 
  async onFileSelected(event: any) {
  const files = event.target.files; // list of files user selected in file picker
  if (!files || files.length === 0) return;

  this.isUploadingMedia = true; // displas spinner
  for (const file of files) { //loops thru every selected file
    try {
      const base64 = await this.fileToBase64(file);
      const isVideo = file.type.startsWith('video/');
      const format = file.type.split('/')[1];
      const resourceType: 'image' | 'video' = isVideo ? 'video' : 'image';
      const url = await this.cloudinary.uploadMedia(base64, format, resourceType);
      this.mediaFiles.push({ url, type: resourceType }); //uploads to cloudinary and adds returned URL to mediaFiles
    } catch (err) {
      console.error('Failed to upload media', err);
    }
  }
  this.isUploadingMedia = false;
}

  // Convert file to base64
  fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => { //creates promise that will return a value
      const reader = new FileReader(); //file reading api
      reader.onload = (e: any) => resolve(e.target.result.split(',')[1]); //gives data:image/jpeg;base64,/9j/4AAQ...
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // DELETE MEDIA
  removeMedia(index: number) {
    this.mediaFiles.splice(index, 1);
  }

  // SUBMIT POST
  async onShare() {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const token = this.authService.getToken();
      const postsUrl = this.apiUrl.replace('/users', '/posts'); // replace /users with /posts 

      const body: any = {
        post_type: this.postType,
        caption: this.caption,
        cuisine_type: this.cuisineType,
        media: this.mediaFiles.map(m => ({ url: m.url, type: m.type })), //converts mediaFiles array to format for Django
      };

      if (this.postType === 'recipe') {
        body.cook_time = this.cookTime;
        body.serving_size = this.servingSize;
        body.difficulty = this.difficulty;
        body.diet_req = this.dietReq;
        body.instructions = this.instructions
          .filter(s => s.trim()) //remobes empty steps
          .join('\n'); //joins all steps into one string with new lines betw them
        body.ingredients = this.ingredients
          .filter(i => i.name.trim()) //remobes empty ingredient rows
          .map(i => ({
            name: i.name,
            quantity: parseFloat(i.quantity) || null, //converts wuantity string to number 2.5
            unit: i.unit
          }));
      } else {
        body.restaurant_name = this.restaurantName;
        body.location = this.location;
        body.price = this.price;
        body.rating = this.rating;
        body.dining_type = this.diningType;
        body.diet_option = this.dietOption;
      }

      await lastValueFrom( //sends POST request to Django w/ post data and JTW token in header
        this.http.post(`${postsUrl}/create/`, body, {
          headers: { Authorization: `Bearer ${token}` }
        })
      );

      this.isLoading = false;
      this.router.navigate(['/tabs/profile']);

    } catch (err: any) {
      this.isLoading = false;
      this.errorMessage = 'Failed to create post. Please try again.';
      console.error(err);
    }
  }

  onCancel() {
    this.router.navigate(['/tabs/home']);
  }

}
