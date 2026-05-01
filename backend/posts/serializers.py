from rest_framework import serializers #gives ModelSerializer, CharField
from .models import Post, PostMedia, Recipe, Review, RecipeIngredient
# . means from same folder (posts). imports our post models

# POST MEDIA SERIALIZER
#converts PostMedia objects to JSON
class PostMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostMedia
        fields = ['id', 'media_url', 'media_type'] #media_url = cloudinary URL of image/video


# RECIPE INGREDIENT SERIALIZER
class RecipeIngredientSerializer(serializers.ModelSerializer):
    ingredient_name = serializers.CharField(source='ingredient.ingredient_name')
     #source='ingredient.ingredient_name' = returns ingredient name instead of id from ingredient foreign key to ingredient model
    quantity = serializers.SerializerMethodField()

    #returns ingredient name, quantity and unit 
    class Meta:
        model = RecipeIngredient
        fields = ['id', 'ingredient_name', 'quantity', 'unit']

    def get_quantity(self, obj):
        if obj.quantity is None:
            return None
        return float(obj.quantity)  # 4.00 = 4, 4.25 

# RECIPE SERIALIZER
class RecipeSerializer(serializers.ModelSerializer):
    #ingredients is a nested serializer, instead of returning ingredient id it uses RecipeIngredientSerializer to return full imgredient objects
    ingredients = RecipeIngredientSerializer(many=True, read_only=True) # many=True cuz many ingredients. read_only cuz ingredients are not created here (created in RecipeIngredientSerializer)

    #returns recipe details with list of ingredients
    class Meta:
        model = Recipe
        fields = ['id', 'diet_req', 'cook_time', 'difficulty', 'instructions', 'serving_size', 'ingredients']


# REVIEW SERIALIZER
class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review # converts all review fields to JSON
        fields = ['id', 'restaurant_name', 'location', 'price', 'rating', 'diet_option', 'dining_type']


# POST SERIALIZER
class PostSerializer(serializers.ModelSerializer):
    #nested serializers 
    media = PostMediaSerializer(many=True, read_only=True) # many cuz a post can have have manu photos
    recipe = RecipeSerializer(read_only=True) #if post is a recipe it returns full recipe data, if review it returns null
    review = ReviewSerializer(read_only=True) 
    username = serializers.CharField(source='user.username', read_only=True) # instead of returning user id it will return username instead followung FK to User model (Displays who made the post)
    profile_picture = serializers.CharField(source='user.profile_picture', read_only=True) #returns post's user pfp URL to display their avatar next to the post
    likes_count = serializers.SerializerMethodField() # SerializerMethodField() used when value needs to be calculated. Looks for matho get_likes_count
    comments_count = serializers.SerializerMethodField()

    class Meta: # defines everyhting frontend receives for a post all in one API call
        model = Post
        fields = ['id', 'post_type', 'caption', 'cuisine_type', 'created_at', 'username', 'profile_picture', 'media', 'recipe', 'review', 'likes_count', 'comments_count']

    # obj = Post instance serialized
    def get_likes_count(self, obj): #obj.likes uses related_name='likes' from Like model to access all likes
        return obj.likes.count() #.count() runs SELECT COUNT SQL query
    
    def get_comments_count(self, obj): 
        return obj.comments.count()
    