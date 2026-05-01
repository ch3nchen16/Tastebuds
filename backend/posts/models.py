from django.db import models #import Django's models module (goves CharField, TextField, ForeignKey etc.)
from users.models import User #impors our User model to link posts to users

# POST
class Post(models.Model): #creates post table in Postgresql. All models inherit from models.Model which gives Django's DB functionality
    
    POST_TYPES = [  #choices list like enum
        ('recipe', 'Recipe'), # 'recipe' = what's stored in the DB, 'Recipe' = human-readable label 
        ('review', 'Review'),
    ]

    #fields for post model (same as our ERD)
    post_type = models.CharField(max_length=10, choices=POST_TYPES) # Charfield = stores text, max_length = nax characters and choices= only allows recipe or review
    caption = models.TextField(blank=True, null=True) #this field can be left null in the DB and left blank in forms
    cuisine_type = models.CharField(max_length=50, blank=True, null=True) #oprional ex. Italian
    created_at = models.DateTimeField(auto_now_add=True) #automatically sets current date time when post is created
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts') #links each post to a user. on_delete-models.CASCADE = if user is deleted then all posts are deleted too. related_names='posts' allows user.posts.all() to get all posts by a user

    #defines how post appears in Django admin = testuser-recipe-1
    def __str__(self):
        return f"{self.user.username} - {self.post_type} - {self.id}"


# POST MEDIA
class PostMedia(models.Model): 
    
    #choices for media type
    MEDIA_TYPES = [
        ('image', 'Image'),
        ('video', 'Video'),
    ]

    media_url = models.URLField(max_length=500) #URLField =stores a URL & validates it.
    media_type = models.CharField(max_length=10, choices=MEDIA_TYPES) #max_length=10 in for breathing room
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='media') #if post is deleted then all media is deleted too

    def __str__(self):
        return f"{self.post.id} - {self.media_type}"


#RECIPE 
class Recipe(models.Model):

    #choices for recipe difficulty
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('advanced', 'Advanced'),
    ]

    post = models.OneToOneField(Post, on_delete=models.CASCADE, related_name='recipe') # each recipe belongs to one post and each post can have at most 1 recipe
    diet_req = models.JSONField(blank=True, null=True) # optionsl JSONField = stores data like lists or dictionaries ex. ["vegan", "gluten-free"]
    cook_time = models.IntegerField() #required
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES) #required
    instructions = models.TextField() #stores step by step instructions as long text required
    serving_size = models.IntegerField() # 4 = 4 people required

    def __str__(self):
        return f"Recipe for post {self.post.id}"


#INGREDIENT
class Ingredient(models.Model):
    ingredient_name = models.CharField(max_length=50, unique=True) # unique=true = no duplicates so for ex "Cheddar" can only be added once to our master list of ingredients

    def __str__(self):
        return self.ingredient_name


#RECIPE INGREDIENT
class RecipeIngredient(models.Model): #bridge table in our ERD 

    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='ingredients') #recipe can use many ingredients
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE) #each ingredient can be used in many recipes
    quantity = models.DecimalField(max_digits=10, decimal_places=2) #ex. 2.5 cups of flour, req
    unit = models.CharField(max_length=50, blank=True, null=True) #ex. cups, grams req

    def __str__(self):
        return f"{self.ingredient.ingredient_name} for recipe {self.recipe.id}"
    

#REVIEW
class Review(models.Model):

    RATING_CHOICES = [(i, i) for i in range(1, 6)] # 1 to 5 stars
    #[(1,1), (2,2), (3,3), (4,4), (5, 5)]

    post = models.OneToOneField(Post, on_delete=models.CASCADE, related_name='review') #each review can only belong to one post & each post can have only 1 review
    restaurant_name = models.CharField(max_length=100) #required
    location = models.CharField(max_length=100) #required
    price = models.CharField(max_length=100) #required
    rating = models.IntegerField(choices=RATING_CHOICES) #required
    diet_option = models.JSONField(blank=True, null=True) #optional
    dining_type = models.JSONField(blank=True, null=True) #optional ex fine dining, casual, fast food

    def __str__(self):
        return f"Review for {self.restaurant_name} - {self.rating} stars"

    



