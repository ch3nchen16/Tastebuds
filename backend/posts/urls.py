from django.urls import path #path function to define URL patterns
from . import views #imports our views.py

urlpatterns = [
    path('', views.get_posts, name='get_posts'), # '' = base url (/api/posts/) (GET)
    path('create/', views.create_post, name='create_post'), #api/posts/create/, calls create_post view (POST)
    path('<int:post_id>/', views.get_post, name='get_post'), #api/posts/post_id ex api/posts/5, calls get_post view (GET)
    path('user/<str:username>/', views.get_user_posts, name='get_user_posts'), #/api/posts/user/testuser/ , calls get_user_post view (GET)
    path('<int:post_id>/delete/', views.delete_post, name='delete_post') #/api/posts/5/delete , calls delete_post view (DELETE)
]