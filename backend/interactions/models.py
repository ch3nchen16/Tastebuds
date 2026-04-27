from django.db import models
from users.models import User

# FOLLOW
class Follow(models.Model):
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name='following') # the user who is following
    following = models.ForeignKey(User, on_delete=models.CASCADE, related_name='followers') # the user being followed
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('follower', 'following') # prevents duplicate follows e.g. user1 can only follow user2 once

    def __str__(self):
        return f"{self.follower.username} follows {self.following.username}"
