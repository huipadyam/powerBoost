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
### 알게 된 점
#### 1. 비밀번호 해싱
db 저장 전에 bcrypt로 해싱

    const hashedPassword = bcrypt.hashSync(password, 8);
- 'password' : 해싱할 비밀번호
- '8' : 해시 알고리즘의 비용 인자. 값이 클수록 보안 강화, 해싱 오래걸림

#### 2. 비밀번호 검증
로그인 시 '입력된 비밀번호'와 'db에 저장된 해시된 비밀번호' 비교

    const passwordIsValid = bcrypt.compareSync(password, user.password);
- 'password' : 입력된 비밀번호
- 'user.password' : db에 저장된 해시된 비밀번호

#### 3. JWT(JSON Web Token) 생성
비밀번호 검증 후 JWT 생성하여 사용자 세션, 인증 관리
    const token = jwt.sign({ id: user.id, nickname: user.nickname }, JWT_SECRET, {
        expiresIn: 86400  // 24시간 동안 유효
    });
- '{ id: user.id, nickname: user.nickname }' : JWT의 payload - JWT에 사용될 사용자 정보
- 'JWT_SECRET' : 토큰을 sign하는 데 사용되는 비밀 키(토큰의 무결성과 진위 검증)
- 'expiresIn: 86400' : 유효기간. 86400초 = 24시간
- sign 함수는 생성된 JWT를 반환

#### 4. JWT 검증
사용자가 제공한 JWT의 유효성 검증, 사용자 정보 추출하여 라우트 보호
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(500).send('토큰 인증 실패');  // 토큰 인증 실패 시 500 응답
        }

        req.userId = decoded.id;  // 검증된 토큰에서 사용자 ID 추출
        req.nickname = decoded.nickname;  // 검증된 토큰에서 사용자 닉네임 추출
        next();  // 다음 미들웨어로 이동
    });
- token: 사용자가 제공한 JWT
- JWT_SECRET: 토큰을 검증하는 데 사용되는 비밀 키
- 검증에 실패한 경우, 500 상태 코드와 '토큰 인증 실패' 메시지를 반환
- 검증에 성공하면, 사용자 ID와 닉네임을 추출하여 req 객체에 저장 -> 이후 미들웨어나 라우트 핸들러에서 req.userId와 req.nickname 사용 가능
- next(): 다음 미들웨어로 제어 넘김
