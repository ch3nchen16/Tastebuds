from django.urls import path
from . import views #views.py

urlpatterns = [
    path('follow/<str:username>/', views.follow_user, name='follow_user'), #/api/interactions/follow/testuser/ calls follow_user view, POST
    path('unfollow/<str:username>/', views.unfollow_user, name='unfollow_user'), #/api/interactions/unfollow/testuser/ calls unfollow_user view, DELETE
    path('is-following/<str:username>/', views.is_following, name='is_following'), #/api/interactions/is-following/testuser/ calls is_following, GET
    path('followers/<str:username>/', views.get_followers, name='get_followers'), #/api/interactions/followers/testuser/ calls get_followers, GET
    path('following/<str:username>/', views.get_following, name='get_following'), #/api/interactions/followers/testuser/ calls get_following, GET
    path('following-posts/', views.get_following_posts, name='get_following_posts'), #/api/interactions/following-posts/ calls get_following_posts, GET
]