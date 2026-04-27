from django.urls import path
from . import views

urlpatterns = [
    path('follow/<str:username>/', views.follow_user, name='follow_user'),
    path('unfollow/<str:username>/', views.unfollow_user, name='unfollow_user'),
    path('is-following/<str:username>/', views.is_following, name='is_following'),
    path('followers/<str:username>/', views.get_followers, name='get_followers'),
    path('following/<str:username>/', views.get_following, name='get_following'),
    path('following-posts/', views.get_following_posts, name='get_following_posts'),
]