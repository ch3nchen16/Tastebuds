from django.contrib import admin
from .models import Post, PostMedia, Recipe, Ingredient, RecipeIngredient, Review #import our models to register in admin so we can see them in admin dashboard

# Register your models here.
@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'post_type', 'cuisine_type', 'created_at']
#we don't add all the fields to list_display because we want to keep the admin dashboard clean
#it is just a summary, only showing the most important fields. we can click on each post to see all the details ex caption

@admin.register(PostMedia)
class PostMediaAdmin(admin.ModelAdmin):
    list_display = ['id', 'post', 'media_type', 'media_url']

@admin.register(Recipe)
class RecipeAdmin(admin.ModelAdmin):
    list_display = ['id', 'post', 'difficulty', 'cook_time', 'serving_size']

@admin.register(Ingredient)
class IngredientAdmin(admin.ModelAdmin):
    list_display = ['id', 'ingredient_name']

@admin.register(RecipeIngredient)
class RecipeIngredientAdmin(admin.ModelAdmin):
    list_display = ['id', 'recipe', 'ingredient', 'quantity', 'unit']

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['id', 'post', 'restaurant_name', 'location', 'rating']


