from rest_framework import serializers
from .models import Comment, Reply #Comment, Reply model
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
