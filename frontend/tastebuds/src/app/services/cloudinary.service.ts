import { Injectable } from '@angular/core'; //sp it can be injected to other components

@Injectable({  //makes it available across the entire app
    providedIn: 'root' 
})
export class CloudinaryService {
    private cloudName = 'dumfvjgcd'; //my clousinary account, private so only this service can access it
    private uploadPreset = 'tastebuds_uploads'; //my upload preset name. This allows unsigned uploads so Ionic can upload directly to cloudinary w/o the secret API key
    
    //Upload Function
    async uploadMedia(base64Data: string, format: string, resourceType: 'image' | 'video' = 'image'): Promise<string> {
        //base64Data = the img/vid will be converted to base64 text
        //format = file format ex. jpeg, png, mp4
        //resourceType = whether it's video or image
        //if resource type is not specified then default = image

        const formData = new FormData(); //FormData object (standard way to send files over HTTP) 
        formData.append('file', `data:${resourceType}/${format};base64,${base64Data}`); //adds actual file to form 
        formData.append('upload_preset', this.uploadPreset); //tells cloudinary which upload preset ti use
        formData.append('resource_type', resourceType); //tells cloudinary whether we're uploading and img or vid

        const response = await fetch(`https://api.cloudinary.com/v1_1/${this.cloudName}/${resourceType}/upload`, {
            //fetch() = Javascript's built-in HTTP request function
            //Image = https://api.cloudinary.com/v1_1/dumfvjgcd/image/upload
            // video = https://api.cloudinary.com/v1_1/dumfvjgcd/video/upload

            method: 'POST', //sending data to creare smth new
            body: formData //form data containing our file
        });

        if (!response.ok) {
            throw new Error('Failed to upload media');
        }
        
        const data = await response.json(); //convert sresponse from cloudinary to Javascript object
        return data.secure_url; //HTTPS URL of uploaded file that we save to postgresql
    }
}