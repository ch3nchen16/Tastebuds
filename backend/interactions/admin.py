from django.contrib import admin #django's built in admin module for registering models
from .models import Follow, Like, Comment, Reply #our Follow, Like, Reply, Comment models

# REGISTERS FOLLOW MODEL
@admin.register(Follow) #decorator that registers Follow model w/ admin site
class FollowAdmin(admin.ModelAdmin): #FollowAdmin class customises how Follow table looks in admin dashboard, admin.ModelAdmin gives all defauult admin functionality
    list_display = ['follower', 'following', 'created_at'] # what appears on dashboard

 # REGISTERS LIKE MODEL
@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ['user', 'post', 'created_at']

# REGISTERS COMMENT MODEL
@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ['user', 'post', 'text', 'created_at']

# REGISTERS REPLY MODEL
@admin.register(Reply)
class ReplyAdmin(admin.ModelAdmin):
    list_display = ['user', 'comment', 'text', 'created_at']