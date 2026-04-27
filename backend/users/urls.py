from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    path('logout/', views.logout, name='logout'),
    path('me/', views.me, name='me'),
    path('get-email/<str:username>/', views.get_email, name='get_email'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/<str:username>/', views.get_profile, name='get_profile'),
    path('update-profile/', views.update_profile, name='update_profile'),
    path('search/', views.search_users, name='search_users'),
]