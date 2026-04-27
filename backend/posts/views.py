from rest_framework import status #gives HTTP status codes ex. HTTP_404_NOT_FOUND
from rest_framework.decorators import api_view, permission_classes #api_view returns Python function into a REST API endpoint & specifies which HTTP methos it accepts
from rest_framework.permissions import IsAuthenticated, AllowAny #IsAuthenticated = only logged in users with valid JWT token can access
from rest_framework.response import Response #gives Response object which automaticaly converts Pyhton dictionaries to JSON to send to frontend
from .models import Post, PostMedia, Recipe, Review, Ingredient, RecipeIngredient #imports all our post models
from .serializers import PostSerializer #imports PostSerializer to convert post objects to JSON for response
from django.db import transaction #gives .atomic() = groups database operations together so they all succeed or all fail (for post creation)

# CREATE A POST
@api_view(['POST']) #only accepts POST requests (create new data)
@permission_classes([IsAuthenticated]) #requires authentication
def create_post(request):
    try:
        data = request.data # JSON body sent from frontend
        post_type = data.get('post_type') #gets post_type drom data

        # Validate Media
        if not data.get('media') or len(data.get('media')) == 0:
            return Response({'error': 'At least one photo or video is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validta Recipe inputs
        if post_type == 'recipe':
            if not data.get('cook_time'):
                return Response({'error': 'Cook time is required'}, status=status.HTTP_400_BAD_REQUEST)
            if not data.get('serving_size'):
                return Response({'error': 'Serving size is required'}, status=status.HTTP_400_BAD_REQUEST)
            if not data.get('difficulty'):
                return Response({'error': 'Difficulty is required'}, status=status.HTTP_400_BAD_REQUEST)
            if not data.get('instructions'):
                return Response({'error': 'Instructions are required'}, status=status.HTTP_400_BAD_REQUEST)
            ingredients = data.get('ingredients', [])
            if not ingredients or not any(i.get('name') for i in ingredients):
                return Response({'error': 'At least one ingredient is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Checks if every ingredient has quantity and unit
            for item in ingredients:
                if item.get('name'):
                    if not item.get('quantity'):
                        return Response({'error': f'Quantity is required for {item["name"]}'}, status=status.HTTP_400_BAD_REQUEST)
                    if not item.get('unit'):
                        return Response({'error': f'Unit is required for {item["name"]}'}, status=status.HTTP_400_BAD_REQUEST)
                    
        # Validate Review inputs
        if post_type == 'review':
            if not data.get('restaurant_name'):
                return Response({'error': 'Restaurant name is required'}, status=status.HTTP_400_BAD_REQUEST)
            if not data.get('location'):
                return Response({'error': 'Location is required'}, status=status.HTTP_400_BAD_REQUEST)
            if not data.get('price'):
                return Response({'error': 'Price range is required'}, status=status.HTTP_400_BAD_REQUEST)
            if not data.get('rating'):
                return Response({'error': 'Rating is required'}, status=status.HTTP_400_BAD_REQUEST)

        #transactions.atomic() = tells Django to treat everything inside as one single DB transaction                   
        with transaction.atomic():

            #creates base post record in POstgresql
            post = Post.objects.create(
                user=request.user, #Djano gets logged in user from JWT token
                post_type=post_type,
                caption=data.get('caption', ''), #gets caption, defaults to empty string if none
                cuisine_type=data.get('cuisine_type', '')
            )

            # ADD MEDIA
            #gets list of media files from the request
            media_list = data.get('media', [])
            for media in media_list: #loops thru each one and creates PostMedia record
                PostMedia.objects.create(
                    post=post,
                    #each media needs a url and type
                    media_url=media['url'],
                    media_type=media['type']
                )

            # CREATE RECIPE OR REVIEW BASED ON POST TYPE
            if post_type == 'recipe':
                recipe = Recipe.objects.create( #if recipe then creates recipe record linked to post
                    post=post,
                    diet_req=data.get('diet_req', []),
                    cook_time=data.get('cook_time'),
                    difficulty=data.get('difficulty'),
                    instructions=data.get('instructions'),
                    serving_size=data.get('serving_size')
                )

                # ADD RECIPE INGREDIENTS
                ingredients = data.get('ingredients', []) #gets ingredient list from request
                for item in ingredients:
                    ingredient, _ = Ingredient.objects.get_or_create( #get_or_create = check if ingredient already exists in master list, if yes use it, if no creates it
                        ingredient_name=item['name']
                    )
                    RecipeIngredient.objects.create( #creates bridge table record linkign recipe to ingredient w/ quantity and unit
                        recipe=recipe,
                        ingredient=ingredient,
                        quantity=item.get('quantity'),
                        unit=item.get('unit')
                    )
            
            #if review, create review record instead
            elif post_type == 'review':
                Review.objects.create(
                    post=post,
                    restaurant_name=data.get('restaurant_name'),
                    location=data.get('location'),
                    price=data.get('price'),
                    rating=data.get('rating'),
                    diet_option=data.get('diet_option', []),
                    dining_type=data.get('dining_type', [])
                )
            
        serializer = PostSerializer(post) # reializers created post and returns to Frontend
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    except Exception as e: #catches any error
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    

# GET ALL POSTS (FOR FEED)
@api_view(['GET']) #fetch data
@permission_classes([AllowAny]) #anyone can see feed 
def get_posts(request): 
    posts = Post.objects.all().order_by('-created_at') #get all posts from DB - = newest first
    serializer = PostSerializer(posts, many=True) # many = serializes a lot of posts
    return Response(serializer.data)


# GET A SINGLE POST
@api_view(['GET'])
@permission_classes([AllowAny])
def get_post(request, post_id):
    try:
        post = Post.objects.get(id=post_id) #one post by its id
        serializer = PostSerializer(post)
        return Response(serializer.data)
    except Post.DoesNotExist: #if it doesnt exist
        return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)

# GET POSTS BY USERS
@api_view(['GET'])
@permission_classes([AllowAny])
def get_user_posts(request, username):
    try: 
        posts = Post.objects.filter(user__username=username).order_by('-created_at') #__ = access user model to filter posts by username
        serializer = PostSerializer(posts, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

# DELETE A POST
@api_view(['DELETE'])
@permission_classes([IsAuthenticated]) #must be logged in
def delete_post(request, post_id):
    try:
        post = Post.objects.get(id=post_id, user=request.user) 
        post.delete()
        return Response({'message': 'Post deleted successfully'})
    except Post.DoesNotExist:
        return Response({'error': 'Post not found or not authorised'},
                        status=status.HTTP_404_NOT_FOUND)       
