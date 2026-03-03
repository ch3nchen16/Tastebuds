from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    bio = models.TextField(blank=True, null=True)
    profile_picture = models.URLField(blank=True, null=True)
    firebase_uid = models.CharField(max_length=255, unique=True, blank=True, null=True)

    def __str__(self):
        return self.username