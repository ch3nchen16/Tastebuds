from django.contrib.auth.models import AbstractUser #extends Django's built-in user model
from django.db import models

class User(AbstractUser):
    #additional fields for the User model
    phone = models.CharField(max_length=20, blank=True, null=True)
    display_name = models.CharField(max_length=50, blank=True, null=True)
    profile_picture = models.URLField(max_length=500, blank=True, null=True)
    bio = models.TextField(max_length=500, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self): #returns a string representation of the user, which is the username
        return self.username