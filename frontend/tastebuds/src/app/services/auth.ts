import { Injectable } from '@angular/core'; //marks this class as a service that can be injected into other components (reusable)
import { HttpClient } from '@angular/common/http'; //built in tool for making HTTP requests to our Django API
import { Observable , BehaviorSubject } from 'rxjs'; // stream of future data, a stpecial type of observable that holds a current value and broadcasts it to anyone listening
import { tap } from 'rxjs/operators'; //operator that lets you peek at the response without changing data

@Injectable({ 
  providedIn: 'root', //create one instance of this service for the whole app so every component uses the same AuthService and has access to the same user data and login state
})
export class AuthService {
  private apiUrl = 'http://127.0.0.1:8000/api/users'; //base URL for backend, every request uses this
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

  //Register Method
  register(username: string, email: string, password: string): Observable<any> { //expects username, email, pw and returns an observable becuase HTTP request is asynchronous and when the server responds leter it willl send the data
    return this.http.post(`${this.apiUrl}/register/`, { username, email, password }); //sends PSOT request to backend. (POST because it creates a new user)
  } //apiURL (register endpoint) = http://127.0.0.1:8000/api/users/register/
  //sends user's registration data to backend so a new account can be made.

  //Login Method
  //this method is called by login form and triggers login request
  login(username: string, password: string): Observable<any> { //angukar sens POST request to Django. Ex {"username": "chen", "password: "password123"} to login endpoint (apiURL)
    return this.http.post(`${this.apiUrl}/login/`, { username, password }).pipe( //inside pipe you can run operators (we use tap())
      tap((response: any) => { //tap lets us look at the response and perform side effects wihtout changing the original response before it reaches the components
        //these are the side effects when a user logs in successfully
        localStorage.setItem('access_token', response.access); //saves tokens to local storage
        localStorage.setItem('refresh_token', response.refresh); //saves user data
        localStorage.setItem('user', JSON.stringify(response.user)); //updates behavior subject with logged in user's data so the whole app knows someone logged in, JSON.stringify turns user object into a string to save in local storage
        this.currentUserSubject.next(response.user);  //updates so the whole app knows someone logged in
      })
    );
  }

  //Logout Method
  logout(): void {
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
}
