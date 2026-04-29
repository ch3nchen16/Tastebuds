from django.contrib import admin #django's built in admin module for registering models
from .models import Follow, Like #our Follow and Like models

@admin.register(Follow) #decorator that registers Follow model w/ admin site
class FollowAdmin(admin.ModelAdmin): #FollowAdmin class customises how Follow table looks in admin dashboard, admin.ModelAdmin gives all defauult admin functionality
    list_display = ['follower', 'following', 'created_at'] # what appears on dashboard

@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ['user', 'post', 'created_at']