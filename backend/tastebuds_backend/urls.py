"""
URL configuration for tastebuds_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls), #routes to django's admin dashboard http://127.0.0.1:8000/admin/
    path('api/users/', include('users.urls')), #tells django to look inside users/urls.py http://127.0.0.1:8000/api/users/
    path('api/posts/', include('posts.urls')) #look inside posts/urls.py http://127.0.0.1:8000/api/posts/
]
