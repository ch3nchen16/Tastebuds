from rest_framework import serializers
from .models import Comment, Reply, Notification #Comment, Reply model
from users.models import User 

# REPLY SERIALIZER
class ReplySerializer(serializers.ModelSerializer):
    # Follows foreign key to return username & pfp. Needed for frontend to display who make the reply w/o making separate api call
    username = serializers.CharField(source='user.username', read_only=True)
    profile_picture = serializers.CharField(source='user.profile_picture', read_only=True)

    class Meta:
        #return everything forntend needs to display a reply, who made it, pfp, what they said, when
        model = Reply
        fields = ['id', 'username', 'profile_picture', 'text', 'created_at']

# COMMENT SERIALIZER
class CommentSerializer(serializers.ModelSerializer):
    #returns username and pfp 
    username = serializers.CharField(source='user.username', read_only=True)
    profile_picture = serializers.CharField(source='user.profile_picture', read_only=True)

    #nested serializer returns full list of reply objects inside each comment
    replies = ReplySerializer(many=True, read_only=True) #many=True cuz it can have a lot of replies, read_only=True cuz replies are created separateky thru their own endpoint no thru this serializer
    replies_count = serializers.SerializerMethodField() #uses a method to calculate a value

    class Meta:
        model = Comment
        fields = ['id', 'username', 'profile_picture', 'text', 'created_at', 'replies', 'replies_count']

    def get_replies_count(self, obj): #obj = Comment instance
        return obj.replies.count() # runs COUNT SQL query
    
# NOTIFICATION SERIALIZER
class NotificationSerializer(serializers.ModelSerializer):
    # returns sender's username instead of their ID
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    # returns sender's pfp URL
    sender_profile_picture = serializers.CharField(source='sender.profile_picture', read_only=True)
    # returns post ID so frontend can navigate to the post when notification is tapped
    post_id = serializers.IntegerField(source='post.id', read_only=True, allow_null=True)
    # allow_null=True because follow notifs don't have a post
    
    # calculated field that returns a human readable notification message
    message = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = ['id', 'sender_username', 'sender_profile_picture', 'notification_type', 'post_id', 'is_read', 'created_at', 'message']

    def get_message(self, obj):
        # returns a message based on notification type
        if obj.notification_type == 'like':
            return f"liked your post"
        elif obj.notification_type == 'comment':
            return f"commented on your post"
        elif obj.notification_type == 'reply':
            return f"replied to your comment"
        elif obj.notification_type == 'follow':
            return f"started following you"
        return ""

