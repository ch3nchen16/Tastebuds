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