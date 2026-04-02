from rest_framework import serializers
from .models import User #import the User model from models.py

class RegisterSerializer(serializers.ModelSerializer): #serializer for user registration
    password = serializers.CharField(write_only=True) #pw is accepted as input but not returned in the response. prevents leaks

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'firebase_uid'] #fields required for registration

    def create(self, validated_data): #self is the instance of the serializer, validated_data is the data that has been validated by the serializer used to create the user
        user = User.objects.create_user( #create_user is a special method that automatically hashes the password, validates the password and saves the user to the database 
            username=validated_data['username'], #the username is taken from the validated data and passed to the create_user method
            email=validated_data['email'],
            password=validated_data['password'],
            firebase_uid=validated_data.get('firebase_uid', '')
        )
        return user #the created user is returned 

class UserProfileSerializer(serializers.ModelSerializer):#used to send user profile data back to frontend
    class Meta: #specifies the model and fields to be serialized
        model = User #tells which model the serializer is for = User model
        fields = ['id', 'username', 'email', 'bio', 'profile_picture', 'display_name', 'phone' ] #fields to send to frontend
