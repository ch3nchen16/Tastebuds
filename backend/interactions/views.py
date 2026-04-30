from rest_framework import status # http status codes
from rest_framework.decorators import api_view, permission_classes 
#api view = turns py function into REST API endpoint
#permission classes = controls who can access endpoint
from rest_framework.permissions import IsAuthenticated, AllowAny #only logged in users can access
from rest_framework.response import Response #converts py dictionaries to json to send to forntend
from .models import Follow, Like, Comment, Reply, Notification, SavedPost #our follow, like, comment, reply model
from users.models import User #our user model to look up users by username
from posts.models import Post #our Post model
from .serializers import CommentSerializer, ReplySerializer, NotificationSerializer
from django.utils import timezone
from datetime import timedelta

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

        # CREATE FOLLOW NOTIFICATION
        Notification.objects.create(
            recipient=user_to_follow,  # person being followed
            sender=request.user,   # person who followed
            notification_type='follow',
            post=None # no post for follow notifications
        )

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

        # DELETE FOLLOW NOTIFICATION
        Notification.objects.filter(
            recipient=user_to_unfollow,
            sender=request.user,
            notification_type='follow'
        ).delete()

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

# LIKE A POST
@api_view(['POST'])
@permission_classes([IsAuthenticated]) 

#function receives http request & post_id from url 
def like_post(request, post_id):

    #looks up post in DB by its ID
    try:
        post = Post.objects.get(id=post_id)

        # Check if already liked
        if Like.objects.filter(user=request.user, post=post).exists():
            return Response({'error': 'You have already liked this post'}, status=status.HTTP_400_BAD_REQUEST)

        #creates new like record in DB linking user to post
        Like.objects.create(user=request.user, post=post) # request.user is populated by django from token

        # CREATE LIKE NOTIFICATION (only if it's not your own post)
        if post.user != request.user:
            Notification.objects.create(
                recipient=post.user, # post owner
                sender=request.user, # person who liked
                notification_type='like',
                post=post # which post was liked
            )

        return Response({
            'message': 'Post liked',
            'likes_count': post.likes.count()
        }, status=status.HTTP_201_CREATED)

    except Post.DoesNotExist:
        return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)


# UNLIKE A POST
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
#post id from url
def unlike_post(request, post_id):
    try:
        #returns like record for this user &post
        post = Post.objects.get(id=post_id) #looks up post w/ id
        like = Like.objects.filter(user=request.user, post=post).first() #.first() returns object or none

        if not like:
            return Response({'error': 'You have not liked this post'}, status=status.HTTP_400_BAD_REQUEST)

        #deletes like record from db
        like.delete()

        # DELETE LIKE NOTIFICATION
        Notification.objects.filter(
            recipient=post.user,
            sender=request.user,
            notification_type='like',
            post=post
        ).delete()

        return Response({
            'message': 'Post unliked',
            'likes_count': post.likes.count()
        })

    except Post.DoesNotExist:
        return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)

# CHECK IF LIKED + GET LIKES COUNT
@api_view(['GET'])
@permission_classes([IsAuthenticated])
#post id from url
def post_likes(request, post_id):
    try:
        post = Post.objects.get(id=post_id) #looks up post by id
        #.exist() returs true or false , checks if user liked post 
        is_liked = Like.objects.filter(user=request.user, post=post).exists() 

        #returs both whether current user liked the post and total like count
        return Response({
            'is_liked': is_liked, #like heart
            'likes_count': post.likes.count()
        })

    except Post.DoesNotExist:
        return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)

# GET COMMENTS FOR A POST
@api_view(['GET'])
@permission_classes([AllowAny]) #no need to be authenticated to see comments
def get_comments(request, post_id):
    try:
        post = Post.objects.get(id=post_id)

        #get limit and offset from URL query parameters
        # /api/interactions/comments/5/?limit=5&offset=0
        limit = int(request.query_params.get('limit', 5)) # default 5 comments
        offset = int(request.query_params.get('offset', 0)) # default start from beginning

        #gets all comments for this post, Comment model already orders by -created_at so newest first
        comments = Comment.objects.filter(post=post)
        # total number of comments on this post
        total_count = comments.count() 
        #seria;izes all comments including nested replies (cuz ReplySerializer nested inside)
        serializer = CommentSerializer(comments, many=True)
        return Response({
            'comments': serializer.data,
            'total_count': total_count, # total comments so frontend knows if there are more
            'has_more': (offset + limit) < total_count # true if there are still more comments to load
        })
    except Post.DoesNotExist:
        return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)

# ADD A COMMENT
@api_view(['POST'])
@permission_classes([IsAuthenticated]) #must be logged in
def add_comment(request, post_id):
    try:
        post = Post.objects.get(id=post_id)
        # gets commetn text from request body that frontend sends. ex { "text": "looks delicious!" }
        text = request.data.get('text')

        # validate comment text
        if not text or not text.strip(): #not text catches if text is None (not sent at all), text.strip() catches of it is just empty spaces " "
            return Response({'error': 'Comment text is required'}, status=status.HTTP_400_BAD_REQUEST)

        # creates comment in the DB 
        comment = Comment.objects.create(
            post=post,
            user=request.user, # gets logged in user form JWT token
            text=text.strip() # removes any extra whitespace
        )

        # CREATE COMMENT NOTIFICATION (only if it's not your own post)
        if post.user != request.user:
            Notification.objects.create(
                recipient=post.user, # post owner
                sender=request.user, # person who commented
                notification_type='comment',
                post=post, # which post was commented on
                comment=comment  # which comment was made
            )

        # returns new created comment as JSON so frontend can display
        serializer = CommentSerializer(comment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    except Post.DoesNotExist:
        return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)

# DELETE A COMMENT
@api_view(['DELETE'])
@permission_classes([IsAuthenticated]) #must be logged in
def delete_comment(request, comment_id):
    try:
        #looks for comment that matches both comment_id and belongs to logged in user
        comment = Comment.objects.get(id=comment_id, user=request.user)
        # user=request.user ensures only the comment owner can delete it
        post = comment.post
        
        # DELETE COMMENT NOTIFICATION
        Notification.objects.filter(
            recipient=post.user,
            sender=request.user,
            notification_type='comment',
            post=post
        ).delete()

        comment.delete()
        return Response({'message': 'Comment deleted'})
    #if you try to delete antoher user's commment it returns error
    except Comment.DoesNotExist:
        return Response({'error': 'Comment not found or not authorised'}, status=status.HTTP_404_NOT_FOUND)

# GET REPLIES FOR A COMMENT
@api_view(['GET'])
@permission_classes([AllowAny]) #no need to be authenticated
def get_replies(request, comment_id):
    try:
        # looks up comment user is replying to, if doesnt exist returns 404
        comment = Comment.objects.get(id=comment_id)
        # gets all replies for this comment (no ordering needed cuz Reply model has ordering = ['created_at'])
        replies = Reply.objects.filter(comment=comment)
        serializer = ReplySerializer(replies, many=True)
        return Response(serializer.data)
    except Comment.DoesNotExist:
        return Response({'error': 'Comment not found'}, status=status.HTTP_404_NOT_FOUND)

# ADD A REPLY
@api_view(['POST'])
@permission_classes([IsAuthenticated]) #must be logged in user
def add_reply(request, comment_id):
    try:
        # looks up comment user is trying to reply to
        comment = Comment.objects.get(id=comment_id)
        # gets rpley text from request body that frontend sends
        text = request.data.get('text')

        # validate reply text
        if not text or not text.strip(): # if text is None, if it is just whitespace
            return Response({'error': 'Reply text is required'}, status=status.HTTP_400_BAD_REQUEST)

        # creates reply linked to comment and logged in user
        reply = Reply.objects.create(
            comment=comment,
            user=request.user,
            text=text.strip()
        )

        # CREATE REPLY NOTIFICATION (only if it's not your own comment)
        if comment.user != request.user:
            Notification.objects.create(
                recipient=comment.user, # comment owner
                sender=request.user, # person who replied
                notification_type='reply',
                post=comment.post, # which post the comment belongs to
                comment=comment  # which comment was replied to
            )

        serializer = ReplySerializer(reply)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    except Comment.DoesNotExist:
        return Response({'error': 'Comment not found'}, status=status.HTTP_404_NOT_FOUND)

# DELETE A REPLY
@api_view(['DELETE'])
@permission_classes([IsAuthenticated]) #must be logged in user
def delete_reply(request, reply_id):
    try:
        reply = Reply.objects.get(id=reply_id, user=request.user)
        # user=request.user ensures only the reply owner can delete it
        comment = reply.comment
        reply.delete()

        # DELETE REPLY NOTIFICATION
        Notification.objects.filter(
            recipient=comment.user,
            sender=request.user,
            notification_type='reply',
            post=comment.post
        ).delete()
        return Response({'message': 'Reply deleted'})
    except Reply.DoesNotExist:
        return Response({'error': 'Reply not found or not authorised'}, status=status.HTTP_404_NOT_FOUND)
    
# GET NOTIFICATIONS
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_notifications(request):

    # delete notifications older than 7 days
    # timezone.now() = current datetime, timedelta(days=7) = 7 day duration
    seven_days_ago = timezone.now() - timedelta(days=7)

    Notification.objects.filter(
        recipient=request.user,
        created_at__lt=seven_days_ago   # __lt = less than (older than 7 days)
    ).delete()

    # get remaining notifications
    notifications = Notification.objects.filter(recipient=request.user)

    # split into today and last 7 days
    today = timezone.now().date()
    today_notifications = notifications.filter(created_at__date=today)
    # __date extracts just the date part from the datetime
    last_7_days_notifications = notifications.exclude(created_at__date=today)
    # exclude today's notifications

    today_serializer = NotificationSerializer(today_notifications, many=True)
    last_7_days_serializer = NotificationSerializer(last_7_days_notifications, many=True)

    return Response({
        'today': today_serializer.data,
        'last_7_days': last_7_days_serializer.data
    })

# MARK ALL NOTIFICATIONS AS READ
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def mark_notifications_read(request):

    Notification.objects.filter(
        recipient=request.user,
        is_read=False # only update unread notifications
    ).update(is_read=True)  # bulk update = updates all matching records in single SQL query
    return Response({'message': 'All notifications marked as read'})


# GET UNREAD NOTIFICATIONS COUNT
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def unread_notifications_count(request):

    count = Notification.objects.filter(
        recipient=request.user,
        is_read=False
    ).count()
    return Response({'unread_count': count})

# SAVE A POST
@api_view(['POST'])
# must be logged in user to save post
@permission_classes([IsAuthenticated])
def save_post(request, post_id):
    try:
        #post_id comes from url
        post = Post.objects.get(id=post_id)

        # looks up post by id 
        # check if already saved
        if SavedPost.objects.filter(user=request.user, post=post).exists():
            return Response({'error': 'Post already saved'}, status=status.HTTP_400_BAD_REQUEST)

        # creates new SavedPost record linking user to post
        SavedPost.objects.create(user=request.user, post=post)
        return Response({'message': 'Post saved'}, status=status.HTTP_201_CREATED)

    # if post doesnt exist 
    except Post.DoesNotExist:
        return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)


# UNSAVE A POST
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def unsave_post(request, post_id):
    try:
        post = Post.objects.get(id=post_id) # first() = return first matching object from DB query
        saved = SavedPost.objects.filter(user=request.user, post=post).first() # returns None if not found

        if not saved:
            return Response({'error': 'Post not saved'}, status=status.HTTP_400_BAD_REQUEST)

        saved.delete()
        return Response({'message': 'Post unsaved'})

    except Post.DoesNotExist:
        return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)


# CHECK IF SAVED
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def is_saved(request, post_id):
    try:
        post = Post.objects.get(id=post_id)
        saved = SavedPost.objects.filter(user=request.user, post=post).exists()
        return Response({'is_saved': saved})

    except Post.DoesNotExist:
        return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)


# GET ALL SAVED POSTS
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_saved_posts(request):
    # select_related('post') fetches the post data in the same query instead of making a separate query for each post
    saved = SavedPost.objects.filter(user=request.user).select_related('post')
    
    from posts.serializers import PostSerializer
    # extracts post objects from saved records
    # list comprehension loops thru each saved record & extracts just post object from it 
    posts = [s.post for s in saved]  # we get a list og Post objects that PostSetializer can serialize
    serializer = PostSerializer(posts, many=True)
    return Response(serializer.data)