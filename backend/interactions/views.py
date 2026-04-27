from rest_framework import status # http status codes
from rest_framework.decorators import api_view, permission_classes 
#api view = turns py function into REST API endpoint
#permission classes = controls who can access endpoint
from rest_framework.permissions import IsAuthenticated #only logged in users can access
from rest_framework.response import Response #converts py dictionaries to json to send to forntend
from .models import Follow #our follow model
from users.models import User #our user model to look up users by username

# FOLLOW A USER
@api_view(['POST'])
@permission_classes([IsAuthenticated]) #must be loggedin
def follow_user(request, username): #username comes from URL e.g /api/interactions/follow/testuser/
    try:
        #look up user to follow by username
        user_to_follow = User.objects.get(username=username)

        #prevent following yourself
        if user_to_follow == request.user:
            return Response({'error': 'You cannot follow yourself'}, status=status.HTTP_400_BAD_REQUEST)

        #check if already following
        if Follow.objects.filter(follower=request.user, following=user_to_follow).exists():
            return Response({'error': 'You are already following this user'}, status=status.HTTP_400_BAD_REQUEST)

        #create follow
        Follow.objects.create(follower=request.user, following=user_to_follow) #creates new follow record in postgres linking the two users
        return Response({'message': f'You are now following {username}'}, status=status.HTTP_201_CREATED)

    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


# UNFOLLOW A USER
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def unfollow_user(request, username):
    try:
        #look up user to unfollow
        user_to_unfollow = User.objects.get(username=username)

        #check if following
        follow = Follow.objects.filter(follower=request.user, following=user_to_unfollow).first()
        if not follow:
            return Response({'error': 'You are not following this user'}, status=status.HTTP_400_BAD_REQUEST)

        #delete follow
        follow.delete()
        return Response({'message': f'You have unfollowed {username}'})

    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


# CHECK IF FOLLOWING
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def is_following(request, username):
    try:
        user = User.objects.get(username=username)
        following = Follow.objects.filter(follower=request.user, following=user).exists()
        return Response({'is_following': following})

    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


# GET FOLLOWERS LIST
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_followers(request, username):
    try:
        user = User.objects.get(username=username)
        followers = Follow.objects.filter(following=user).select_related('follower')
        data = [
            {
                'username': f.follower.username,
                'display_name': f.follower.display_name,
                'profile_picture': f.follower.profile_picture,
            }
            for f in followers
        ]
        return Response(data)

    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


# GET FOLLOWING LIST
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_following(request, username):
    try:
        user = User.objects.get(username=username)
        following = Follow.objects.filter(follower=user).select_related('following')
        data = [
            {
                'username': f.following.username,
                'display_name': f.following.display_name,
                'profile_picture': f.following.profile_picture,
            }
            for f in following
        ]
        return Response(data)

    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


# GET FOLLOWING POSTS (for home feed)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_following_posts(request):
    #get list of users the logged in user follows
    following_users = Follow.objects.filter(follower=request.user).values_list('following', flat=True)

    #get posts from those users
    from posts.models import Post
    from posts.serializers import PostSerializer
    posts = Post.objects.filter(user__in=following_users).order_by('-created_at')
    serializer = PostSerializer(posts, many=True)
    return Response(serializer.data)