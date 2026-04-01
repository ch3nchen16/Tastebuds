from django.contrib import admin
from django.contrib.auth.admin import UserAdmin #we inherit features from buil-in UserAdmin class
from .models import User

#admin.py customises the Django admin interface so that the User model appears in admin panel

@admin.register(User) #this decorator registers our custom User model with the Django admin site. This lets us manage users through the admin panel
class CustomUserAdmin(UserAdmin): #this creates a new admin class that extends Django's UserAdmin and adds our custom fields
    model = User #tells Django this admin class is for my custom User model
    list_display = ('username', 'email', 'display_name', 'phone', 'created_at') #controls whcih columns appear in admin list view
    fieldsets = UserAdmin.fieldsets + ( #this contains all default Django user fields and we added our custom fields
        (None, {'fields': ('display_name', 'phone', 'profile_picture', 'bio')}),
    )

