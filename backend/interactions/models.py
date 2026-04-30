from django.db import models #foreignkey datetime
from users.models import User # our custom user model

# FOLLOW
class Follow(models.Model): # creates Follow table in postgresql
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name='following') #user who is following
    following = models.ForeignKey(User, on_delete=models.CASCADE, related_name='followers') # user being followed
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('follower', 'following') # prevents duplicate follows e.g. user1 can only follow user2 once

    def __str__(self):
        return f"{self.follower.username} follows {self.following.username}"

# LIKE 
class Like(models.Model): # creates Like table in Postgresql 
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='likes') # links like to who made it (user who liked)
    post = models.ForeignKey('posts.Post', on_delete=models.CASCADE, related_name='likes') #links like to the post that was liked (post that was liked)
    created_at = models.DateTimeField(auto_now_add=True) #timestamp

    class Meta:
        unique_together = ('user', 'post') # prevents duplicate likes

    # how a Like object appears in admin dashboard
    def __str__(self):
        return f"{self.user.username} liked post {self.post.id}"

# COMMENT
class Comment(models.Model): #creates Comment table in postgresql
    #Links comment to post
    post = models.ForeignKey('posts.Post', on_delete=models.CASCADE, related_name='comments') #post.comments.all() gets all comments
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    text = models.TextField() #textfield cuz comments can be long
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at'] # - means descending order = newest comments first

    def __str__(self):
        return f"{self.user.username} commented on post {self.post.id}"


# REPLY
class Reply(models.Model): # Creates repy table in postgresql
    #links reply to a comment,  on_delete=models.CASCADE means that if a comments is deleted then all its replies are deleted too
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name='replies') 
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='replies')
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at'] # no - cuz oldest replies first so conversation reads top to bottom

    def __str__(self):
        return f"{self.user.username} replied to comment {self.comment.id}"
    

# NOTIFICATION
class Notification(models.Model):

    NOTIFICATION_TYPES = [
       #('database', 'readable')
        ('like', 'Like'),  # someone liked your post
        ('comment', 'Comment'), # someone commented on your post
        ('reply', 'Reply'), # someone replied to your comment
        ('follow', 'Follow'), # someone followed you
    ]

    # user who receives the notif
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    # user who triggered the notif
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_notifications')
    # what type of notif it is (like, comment, reply, follow)
    notification_type = models.CharField(max_length=10, choices=NOTIFICATION_TYPES)
    # links notif to a post (allows null cuz you follow a user not a post)
    post = models.ForeignKey('posts.Post', on_delete=models.CASCADE, related_name='notifications', null=True, blank=True)
    # false by default, set to true when user opens notifications page
    is_read = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # - newest notifications first
        ordering = ['-created_at'] 

    def __str__(self):
        return f"{self.sender.username} {self.notification_type} -> {self.recipient.username}"