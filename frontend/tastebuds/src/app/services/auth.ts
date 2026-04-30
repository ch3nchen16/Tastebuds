import { Injectable } from '@angular/core'; //marks this class as a service that can be injected into other components (reusable)
import { HttpClient } from '@angular/common/http'; //built in tool for making HTTP requests to our Django API
import { BehaviorSubject, lastValueFrom, Observable } from 'rxjs'; // stream of future data, a stpecial type of observable that holds a current value and broadcasts it to anyone listening
import { 
  createUserWithEmailAndPassword,  // creates user in Firebase
  signInWithEmailAndPassword,       // signs in user with Firebase
  signOut,                          // signs out user from Firebase
  sendEmailVerification,            // sends verification email
  UserCredential                    // type for Firebase user credential
} from 'firebase/auth'; //importing functions from Firebase Authentication to handle user auth with Firebase
import { auth } from './firebase.config'; //importing the auth object we set up in firebase.config.ts to use Firebase Authentication in this service
import { sendPasswordResetEmail } from 'firebase/auth'; //importing password resetfunction
import { environment } from '../../environments/environment'; //to get API URL from environment file

@Injectable({ 
  providedIn: 'root', //create one instance of this service for the whole app so every component uses the same AuthService and has access to the same user data and login state
})
export class AuthService {
  private apiUrl = environment.apiUrl; //base URL for backend, every request uses this
  private currentUserSubject = new BehaviorSubject<any>(null); //creates a BehaviorSubject that holds logged in user's data, starts as null bcz noone logged in yet
  currentUser$ = this.currentUserSubject.asObservable(); //turna behavior subject into an observable so other components can subscribe to it and get updates when user logs in or out
  //currentUserSubject is private so only this service can change it, but currentUser$ is public so other components can listen to it and react to changes
  
  //To check if token exists in local storage to keep user logged in
  constructor(private http: HttpClient) { //when service is first created it checks if a user was previously saved in local storage so user stays logged in.
    const user = localStorage.getItem('user'); //looks inside localStorage for saved user
    if (user) {
      this.currentUserSubject.next(JSON.parse(user)); //takes saved user and pushes it into BehaviorSubject to update the current user across the app, JSON.parse turns string into an object 
    }
  } 

  // REGISTER
  async register(
    username: string, 
    email: string, 
    password: string,
  ): Promise<any> { //expects username, email, pw and returns an observable becuase HTTP request is asynchronous and when the server responds leter it willl send the data
    
  // 1. Create user in Firebase Authentication w/ email and pw
  const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
  const firebaseUser = userCredential.user; //get the created user from the credential

  // 2. Send verification email to user 
  await sendEmailVerification(firebaseUser); //sends verification email to the user's email address

  // 3. get Firebase ID token to prove to Django this is real firebase user
  const idToken = await firebaseUser.getIdToken();

  // 4. Save user to Django w/ firebase_uid to link accounts
  try {
    const response: any = await lastValueFrom(
      this.http.post(`${this.apiUrl}/register/`, {
        username,
        email,
        password,
        firebase_uid: firebaseUser.uid 
      }) //sends POST request to Django to create user in Django database, includes Firebase UID to link accounts, includes ID token in headers for authentication
    );

    return response; //returns the response from Django (could be user data or success message)
  } catch (djangoError) {
    //if Django fails, delete Firebase user
    await firebaseUser.delete();
    throw djangoError;
  }
}

// Resend verification email
async resendVerificationEmail(email: string, password: string): Promise<void> {
  // Sign in temporarily to get the Firebase user
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const firebaseUser = userCredential.user;

  // forces firebase to fetch latest user state before sending verification email, wasn't working w/o this cuz firebase was using the cached state which was stale causing an error
  await firebaseUser.reload();
  
  // Send new verification email
  await sendEmailVerification(firebaseUser);
  
  // Sign out again since email isn't verified yet
  await signOut(auth);
} catch (err: any) {
        console.log('Resend error details:', err.code, err.message);
        throw err;
}

// LOGIN
  async login(usernameOrEmail: string, password: string): Promise<any> { 

    let email = usernameOrEmail; //assume input is email

    //1. Check if input is username (if it doesnt contain an @)
    if (!usernameOrEmail.includes('@')) {
      //2. get email from Django using username (the app uses username for login but our Firebase auth uses email)
      const userResponse: any = await lastValueFrom(
        this.http.get(`${this.apiUrl}/get-email/${usernameOrEmail}/`) //sends GET request to Django to get user data based on username, expects response to include user's email{
      );

      email = userResponse.email;
    }
    
  
    // 3. sign in with firebase using email and pw
    const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // 4. Block login if email not verified
    if (!firebaseUser.emailVerified) {
      await signOut(auth);
      throw new Error("Please verify your email before logging in");
    }

    //5. get firebase token
    const firebaseToken = await firebaseUser.getIdToken();

    // 6. send firebase token to Django to get JWT
    const response: any = await lastValueFrom(
      this.http.post(`${this.apiUrl}/login/`, {
        firebase_token: firebaseToken
      })
    );

    // 7. Save JWT and user data in local storage and update behavior subject
    localStorage.setItem('access_token', response.access); //save JWT access token in local storage
    localStorage.setItem('refresh_token', response.refresh);
    localStorage.setItem('user', JSON.stringify(response.user)); //save user data in local storage, stringify turns object into string to save
    this.currentUserSubject.next(response.user); //update BehaviorSubject with logged in user's data so the whole app knows who is logged in

    return response; //return response from Django (could be user data or success message)
  }

  // LOGOUT
  async logout(): Promise<void> {
    await signOut(auth); //signs out user from Firebase Authentication
    localStorage.removeItem('access_token'); //removes everything from local storage
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user'); //removes saved user
    this.currentUserSubject.next(null); //updates BehaviorSubject to null so the whole app knows no one is logged in anymore
  }

  //helper methods 
  getToken(): string | null { //if toekn exists return it as text, otherwise return null
    return localStorage.getItem('access_token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken(); //return a string if token exists, if false (no token) then return null. 
  } //!! turns any value into boolean

  //for resending verification email
  getEmailByUsername(username: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/get-email/${username}/`);
  }

  // FORGOT PASSWORD
  async forgotPassword(usernameOrEmail: string): Promise<void> {
    let email = usernameOrEmail;

    //if username was entered, get email from Django first
    if (!usernameOrEmail.includes('@')) {
      const userResponse: any = await lastValueFrom(
        this.http.get(`${this.apiUrl}/get-email/${usernameOrEmail}/`)
      );
      email = userResponse.email;
    }

    //Send password reset email via Firebase
    await sendPasswordResetEmail(auth, email);
  }

  getCurrentUser(): any {
    return this.currentUserSubject.getValue();
  }

  // REFRESH TOKEN
  async refreshToken(): Promise<string | null> { //async cuz it makes HTTP req, will everntuallt return string or nthn if fails
    try {
      const refreshToken = localStorage.getItem('refresh_token'); //gets refresh token from local storage
      if (!refreshToken) return null; //if none then stops function

      const response: any = await lastValueFrom(
        this.http.post(`${this.apiUrl}/token/refresh/`, { //sends POST rew to Django's refresh token endpoint w/ refresh token, then django validates refresh token and returns new access token if valid
          refresh: refreshToken
        })
      );

      // Save new access token
      localStorage.setItem('access_token', response.access);
      return response.access; //returns new token so it can be used
    } catch (err) {
      // Refresh token expired — log user out
      await this.logout();
      return null;
    }
  }

  // GET VALID TOKEN (refreshes if expired)
  async getValidToken(): Promise<string | null> {
    const token = this.getToken(); //gets current access token from local storage 
    if (!token) return null;

    try {
      // Decode token and check expiry
      const payload = JSON.parse(atob(token.split('.')[1])); //splits token by . , atob = decodes base64 string to readable text
      const expiry = payload.exp * 1000; // convert expiry time to milliseconds
      const now = Date.now(); //gets current time in milliseconds (used to compare against token's expiry date)

      if (now >= expiry) { //if current time is past expire then token is expired
        //Token expired — refresh it
        return await this.refreshToken();
      }
      return token;
    } catch {
      return await this.refreshToken();
    }
  }

}

