from rest_framework import status #for http status codes like HTTP_200_OK
from rest_framework.decorators import api_view, permission_classes #api_view = decorator that turns regular Python function to Django REST Framework view & specisifes which HTTP method is allowed
#permission_classes = decorator that controls who can access each endpoint
from rest_framework.response import Response #response object that converts Python dictionary to JSON and send back to frontend
from rest_framework.permissions import IsAuthenticated, AllowAny #IsAuthenticated = only allows requests w/ valid JWT token
#AllowAny = allows any request regardless of authentication status (used for registration and login endpoints since users won't have a token yet)
from rest_framework_simplejwt.tokens import RefreshToken #to generate JWT tokens for users when they register or login
from .serializers import RegisterSerializer, UserProfileSerializer #imports our serializers
from .models import User #imports our custom user model
import firebase_admin # firebase admin SDK for Python
from firebase_admin import credentials, auth as firebase_auth #credentials=load firebase service account key,
#auth renamed to firebase_auth to avoid confusion w/ Django auth used for Firebase authentication functions like verifying tokens and getting user info from Firebase token
import os #gives access to environment variables

#initialize Firebase Admin SDK
if not firebase_admin._apps: #checks if the Firebase app has already been initialized to prevent re-initialization errors
    cred = credentials.Certificate(os.getenv('FIREBASE_CREDENTIALS')) #reads path to firebase_credentials.json from .env file & credentials.Certificate() loads service account key file & creates credentials object
    firebase_admin.initialize_app(cred) #initializes Firebase admnin SDK with the credentials. After we can verify Firebase tokens.

# REGISTER VIEW
@api_view(['POST']) #this decorator tells Django REST Frameworl that this funtion is an API endpoint that only accepts POST requests
@permission_classes([AllowAny]) #we added this because every endpoint needs a token. So if we don't add this then unregistered users won't be able to register.
def register(request): #The View Function. request contains everything abt incoming request like data, headers, method, etc...
    serializer = RegisterSerializer(data=request.data) #creates RegisterSerializer instance w/ data from request. request.data is JSON body sent from Ionic Frontend like username, email, password
    if serializer.is_valid(): #validates data based on the rules we set in RegisterSerializer 
        user =serializer.save() #if validation passes, this calls the create method in RegisterSerializer which creates the user and saves it to DB
        refresh = RefreshToken.for_user(user) #creates new refresh token for new user.
        return Response({  #return a responcse w/ success msg, access token and refresh token to frontend
            'message': 'User registered successfully',
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED) #201 means created successfully
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST) #If validation failed, returns error msg

# LOGIN VIEW 
@api_view(['POST'])
@permission_classes([AllowAny])
def login(request): #we use try/except bcz multiple things could go wrong like invalid token, user not found
    try:
        # 1. Get Firebase token from request body
        firebase_token = request.data.get('firebase_token')
        if not firebase_token: #if missing return error response
            return Response({'error': 'Firebase token required'}, status=status.HTTP_400_BAD_REQUEST)

        # 2.Verify Firebase token with Firebase Admin SDK
        decoded_token = firebase_auth.verify_id_token(firebase_token) # sends firebase tokens to firebase servers to verify it's genuine, not expired or tampered w/ and returns decoded token if valid
        firebase_uid = decoded_token['uid'] #extracts user's Firebase ID from decodde token. This links Firebase user to Django user since we store firebase uid in user model.

        # 3. Get Django user using firebase_uid
        user = User.objects.get(firebase_uid=firebase_uid)

        # 4. Generate JWT tokens for Django API
        refresh = RefreshToken.for_user(user)
        serializer = UserProfileSerializer(user) #serializes user data to send back to frontend

        # 5. Return response with tokens and user info
        return Response({
            'message': 'User logged in successfully',
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': serializer.data
        })
    except User.DoesNotExist: #catches case where Firebase verified token but no Django user has that firebase_uid
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e: #catches any other error and returns it as error msg
        return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

# GET EMAIL VIEW by username (needed because Firebase uses email but app uses username)
@api_view(['GET']) #only accepts GET requests since we're just fetching data, not creating
@permission_classes([AllowAny])
def get_email(request, username): #request is unused but we need to include it as a parameter since Django REST Framework passes the request object to all view functions
    try:
        user = User.objects.get(username=username) #looks up user by userame and returns email
        return Response({'email': user.email}) #we need this because Firebase uses email to sign in but TasteBuds uses username
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
# ME VIEW to get current user's profile
@api_view(['GET'])
@permission_classes([IsAuthenticated]) #this requires a user to be logged in (must verify token is valid)
def me(request): 
    serializer = UserProfileSerializer(request.user) 
    return Response(serializer.data) #serializes and returns current user's profile data

# LOGOUT VIEW
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        refresh_token = request.data['refresh'] #gets refresh token from request body (to be blacklisted)
        token = RefreshToken(refresh_token) #creates RefreshToken object from token string
        token.blacklist() #blacklists the refresh token after logging out so it cant be used again
        return Response({'message': 'User logged out successfully'})
    except Exception:
        return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)

# GET PROFILE VIEW by username
@api_view(['GET']) 
@permission_classes([AllowAny]) #anyone can view a user's profile by username, no need to be logged in since profiles are public
def get_profile(request, username): #takes username from URL 
    try:
        user = User.objects.get(username=username) #finds user
        serializer = UserProfileSerializer(user) #serializes public profile data and returns it
        return Response(serializer.data)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)