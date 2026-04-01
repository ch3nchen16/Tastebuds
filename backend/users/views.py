from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .serializers import RegisterSerializer, UserProfileSerializer
from .models import User

#Register
@api_view(['POST'])
@permission_classes([AllowAny]) #we added this because every endpoint needs a token. So if we don't add this then unregistered users won't be able to register.
def register(request): #creates new user
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid(): #this serializer validates the data based on the rules we set in RegisterSerializer 
        user =serializer.save() #this calls the create method in RegisterReliazer which creates the user and saved it to DB
        refresh = RefreshToken.for_user(user) #creates new refresh token for user.
        return Response({  #return a responcse w/ success msg, access token and refresh token to frontend
            'message': 'User registered successfully',
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED) #201 means created successfully
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST) #400 means bad request so data wasn't validated successfully

#Login
@api_view(['POST'])
@permission_classes([AllowAny])#without this, a user who isn't logged in yet can't send a token 
def login(request): #authenticates user 
    username = request.data.get('username') 
    password = request.data.get('password')
    user = authenticate(request, username=username, password=password)
    if user is not None:
        refresh = RefreshToken.for_user(user)
        serializer=UserProfileSerializer(user)
        return Response({ #if correct credentials, return success msg, generate new access and refresh token and send user data to frontend
            'message': 'User logged in successfully',
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': serializer.data
        })
    return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED) 

#Get current user's profile
@api_view(['GET'])
@permission_classes([IsAuthenticated]) #this requires a user to be logged in (must verify token is valid)
def me(request): # returns profile of currently logged in user
    serializer = UserProfileSerializer(request.user) 
    return Response(serializer.data)

#Logout
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        refresh_token = request.data['refresh']
        token = RefreshToken(refresh_token)
        token.blacklist() #blacklists the refresj token after logging out so it cant be used again
        return Response({'message': 'User logged out successfully'})
    except Exception:
        return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)

#Get any user's profile by username
@api_view(['GET'])
@permission_classes([AllowAny])
def get_profile(request, username):
    try:
        user = User.objects.get(username=username)
        serializer = UserProfileSerializer(user)
        return Response(serializer.data)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)