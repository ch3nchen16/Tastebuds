from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    model = User
    list_display = ('username', 'email', 'display_name', 'phone', 'created_at')
    fieldsets = UserAdmin.fieldsets + (
        (None, {'fields': ('display_name', 'phone', 'profile_picture', 'bio')}),
    )
# Register your models here.
