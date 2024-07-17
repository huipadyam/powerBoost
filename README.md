# powerBoost Study
## 이화여대 파워부스트 스터디

### API Endpoints

#### 1. User Registration
회원가입 기능을 제공합니다.

- **Endpoint**: `/register`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "username": "username",
    "password": "password",
    "nickname": "nickname"
  }
- **Response**: 201 Created

#### 2. User Login
로그인 기능을 제공합니다.

- **Endpoint**: `/login`
- **Method**: `POST`
- **Request Body**:
```json
{
  "username": "username",
  "password": "password"
}
```
- **Response**:
```json
{
  "auth": true,
  "token": "jwt_token"
}
```
#### 3. User Logout
로그아웃 기능을 제공합니다. 클라이언트 측에서 토큰을 삭제하여 로그아웃합니다.

- **Method**: `클라이언트 측에서 JWT 토큰 삭제`
#### 4. Create a Post
글 작성 기능을 제공합니다.

- **Endpoint**: `/posts`
- **Method**: `POST`
- **Headers**: `x-access-token`: `jwt_token`
- **Request Body**:
```json
{
  "title": "Post Title",
  "content": "Post Content"
}
```
- **Response**: 201 Created
#### 5. Update a Post
글 수정 기능을 제공합니다.

- **Endpoint**: `/posts/:id`
- **Method**: `PUT`
- **Headers**: `x-access-token`: `jwt_token`
- **Request Body**:
```json
{
  "title": "Updated Title",
  "content": "Updated Content"
}
```
- **Response**: 200 OK
#### 6. Delete a Post
글 삭제 기능을 제공합니다.

- **Endpoint**: `/posts/:id`
- **Method**: `DELETE`
- **Headers**: `x-access-token`: `jwt_token`
- **Response**: 200 OK
#### 7. Get All Posts
모든 게시글을 조회하는 기능을 제공합니다.

- **Endpoint**: `/posts`
- **Method**: `GET`
- **Response**:
```json
[
  {
    "id": 1,
    "user_id": 1,
    "title": "Post Title",
    "content": "Post Content",
    "likes": 0
  }
]
```
#### 8. Get a Post
특정 게시글을 조회하는 기능을 제공합니다.

- **Endpoint**: `/posts/:id`
- **Method**: `GET`
- **Response**:
```json
{
  "id": 1,
  "user_id": 1,
  "title": "Post Title",
  "content": "Post Content",
  "likes": 0
}
```
#### 9. Like a Post
게시글에 좋아요를 추가하는 기능을 제공합니다.

- **Endpoint**: `/posts/:id/like`
- **Method**: `POST`
- **Headers**: `x-access-token`: `jwt_token`
- **Response**: 200 OK
#### 10. Add a Comment
댓글 작성 기능을 제공합니다.

- **Endpoint**: `/posts/:postId/comments`
- **Method**: `POST`
- **Headers**: `x-access-token`: `jwt_token`
- **Request Body**:
```json
{
  "content": "Comment Content"
}
```
- **Response**: 201 Created
#### 11. Get Comments for a Post
특정 게시글의 댓글을 조회하는 기능을 제공합니다.

- **Endpoint**: `/posts/:postId/comments`
- **Method**: `GET`
- **Response**:
```json
[
  {
    "id": 1,
    "post_id": 1,
    "user_id": 1,
    "content": "Comment Content"
  }
]
```
