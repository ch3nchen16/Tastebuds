from django.urls import path
from . import views #views.py

urlpatterns = [
    #<str:username> = URL parameter - captures the string in that part of url 
    #name = parameter for each path makes the url reusable
    # FOLLOW
    path('follow/<str:username>/', views.follow_user, name='follow_user'),
    path('unfollow/<str:username>/', views.unfollow_user, name='unfollow_user'), # ex: /api/interactions/unfollow/testuser/, <str:username> captures testuser, gives username = testuser to unfollow_user view, DELETE
    path('is-following/<str:username>/', views.is_following, name='is_following'), #/api/interactions/is-following/testuser/ calls is_following, GET
    path('followers/<str:username>/', views.get_followers, name='get_followers'), #/api/interactions/followers/testuser/ calls get_followers, GET
    path('following/<str:username>/', views.get_following, name='get_following'), #/api/interactions/followers/testuser/ calls get_following, GET
    path('following-posts/', views.get_following_posts, name='get_following_posts'), #/api/interactions/following-posts/ calls get_following_posts, GET
    # LIKE  
    path('like/<int:post_id>/', views.like_post, name='like_post'), # captures post_id int ex, /api/interactions/like/5/ <int:post_id> captures post_id = 5 and gives it to like_post view POST
    path('unlike/<int:post_id>/', views.unlike_post, name='unlike_post'), # calls unlike_post, accepts DELETE
    path('likes/<int:post_id>/', views.post_likes, name='post_likes'), #returns like count and whether current user liked the post, GET
    # COMMENTS
    path('comments/<int:post_id>/', views.get_comments, name='get_comments'), # captures post_id from url ex /api/interactions/comments/5/ gets all comments from post 5 GET
    path('comments/<int:post_id>/add/', views.add_comment, name='add_comment'), # /add/ at the end to distinguish it from get_commetns and calls add_comment instead POST
    path('comments/<int:comment_id>/delete/', views.delete_comment, name='delete_comment'), # captures comment_id /delete/ to delete your own comment using its id DELETE
    # REPLIES 
    path('comments/<int:comment_id>/replies/', views.get_replies, name='get_replies'), # captures comment_id, nested under comments/ cuz replies belong to a comment GET 
    path('comments/<int:comment_id>/replies/add/', views.add_reply, name='add_reply'), # /add/ for add_reply POST 
    path('comments/replies/<int:reply_id>/delete/', views.delete_reply, name='delete_reply'), # captures reply_id to delete a reply using its id DELETE
    # NOTIFICATIONS
    path('notifications/', views.get_notifications, name='get_notifications'), # GET
    path('notifications/read/', views.mark_notifications_read, name='mark_notifications_read'), # PUT
    path('notifications/unread-count/', views.unread_notifications_count, name='unread_notifications_count'), # GET
    # SAVED POSTS
    path('save/<int:post_id>/', views.save_post, name='save_post'),
    path('unsave/<int:post_id>/', views.unsave_post, name='unsave_post'),
    path('is-saved/<int:post_id>/', views.is_saved, name='is_saved'),
    path('saved-posts/', views.get_saved_posts, name='get_saved_posts'),
]