# powerBoost Study
## 이화여대 파워부스트 스터디

API Endpoints


1. User Registration
Endpoint: /register
Method: POST
Request Body:
{
  "username": "your_username",
  "password": "your_password",
  "nickname": "your_nickname"
}
Response: 201 Created

2. User Login
Endpoint: /login
Method: POST
Request Body:
{
  "username": "your_username",
  "password": "your_password"
}
Response:
{
  "auth": true,
  "token": "your_jwt_token"
}


3. Create a Post
Endpoint: /posts
Method: POST
Headers:
x-access-token: your_jwt_token
Request Body:
{
  "title": "Post Title",
  "content": "Post Content"
}
Response: 201 Created


4. Update a Post
Endpoint: /posts/:id
Method: PUT
Headers:
x-access-token: your_jwt_token
Request Body:
{
  "title": "Updated Title",
  "content": "Updated Content"
}
Response: 200 OK

5. Delete a Post
Endpoint: /posts/:id
Method: DELETE
Headers:
x-access-token: your_jwt_token
Response: 200 OK

6. Get All Posts
Endpoint: /posts
Method: GET
Response:
[
  {
    "id": 1,
    "user_id": 1,
    "title": "Post Title",
    "content": "Post Content",
    "likes": 0
  }
]

7. Get a Post
Endpoint: /posts/:id
Method: GET
Response:
{
  "id": 1,
  "user_id": 1,
  "title": "Post Title",
  "content": "Post Content",
  "likes": 0
}

8. Like a Post
Endpoint: /posts/:id/like
Method: POST
Headers:
x-access-token: your_jwt_token
Response: 200 OK

9. Add a Comment
Endpoint: /posts/:postId/comments
Method: POST
Headers:
x-access-token: your_jwt_token
Request Body:
{
  "content": "Comment Content"
}
Response: 201 Created

10. Get Comments for a Post
Endpoint: /posts/:postId/comments
Method: GET
Response:
[
  {
    "id": 1,
    "post_id": 1,
    "user_id": 1,
    "content": "Comment Content"
  }
]
