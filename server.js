const express = require('express');  // Express 모듈을 가져와서 express 변수에 할당
const bodyParser = require('body-parser');  // body-parser 모듈을 가져와서 bodyParser 변수에 할당
const app = express();  // Express 애플리케이션 인스턴스를 생성하여 app 변수에 할당
const PORT = 3000;  // 서버가 실행될 포트를 3000으로 설정

app.use(bodyParser.json());  // JSON 형식의 요청 본문을 파싱하기 위해 body-parser 미들웨어를 사용

let posts = [];  // 게시물 정보를 저장할 배열
let postId = 1;  // 게시물 ID를 관리할 변수
let commentId = 1;  // 댓글 ID를 관리할 변수

// 글 작성
app.post('/posts', (req, res) => {
    const post = {
        id: postId++,  // 고유한 게시물 ID 생성
        title: req.body.title,  // 요청 본문에서 제목을 가져와 설정
        content: req.body.content,  // 요청 본문에서 내용을 가져와 설정
        likes: 0,  // 초기 좋아요 수를 0으로 설정
        comments: []  // 댓글 배열 초기화
    };
    posts.push(post);  // 게시물 배열에 새 게시물 추가
    res.status(201).json(post);  // 상태 코드 201과 함께 새 게시물을 응답
});

// 글 수정
app.put('/posts/:id', (req, res) => {
    const post = posts.find(p => p.id === parseInt(req.params.id));  // 게시물 ID로 게시물을 찾음
    if (post) {
        post.title = req.body.title || post.title;  // 요청 본문에서 제목이 제공되면 변경, 아니면 기존 제목 유지
        post.content = req.body.content || post.content;  // 요청 본문에서 내용이 제공되면 변경, 아니면 기존 내용 유지
        res.json(post);  // 변경된 게시물을 응답
    } else {
        res.status(404).json({ error: 'Post not found' });  // 게시물을 찾지 못한 경우 404 응답
    }
});

// 글 삭제
app.delete('/posts/:id', (req, res) => {
    posts = posts.filter(p => p.id !== parseInt(req.params.id));  // 게시물 ID로 게시물을 필터링하여 삭제
    res.status(204).end();  // 상태 코드 204와 함께 응답 본문 없이 응답
});

// 글 목록 조회
app.get('/posts', (req, res) => {
    res.json(posts);  // 모든 게시물을 JSON 형식으로 응답
});

// 글 상세 조회
app.get('/posts/:id', (req, res) => {
    const post = posts.find(p => p.id === parseInt(req.params.id));  // 게시물 ID로 게시물을 찾음
    if (post) {
        res.json(post);  // 게시물을 JSON 형식으로 응답
    } else {
        res.status(404).json({ error: 'Post not found' });  // 게시물을 찾지 못한 경우 404 응답
    }
});

// 좋아요 기능
app.post('/posts/:id/like', (req, res) => {
    const post = posts.find(p => p.id === parseInt(req.params.id));  // 게시물 ID로 게시물을 찾음
    if (post) {
        post.likes++;  // 좋아요 수 증가
        res.json({ likes: post.likes });  // 증가된 좋아요 수를 JSON 형식으로 응답
    } else {
        res.status(404).json({ error: 'Post not found' });  // 게시물을 찾지 못한 경우 404 응답
    }
});

// 댓글 작성
app.post('/posts/:postId/comments', (req, res) => {
    const post = posts.find(p => p.id === parseInt(req.params.postId));  // 게시물 ID로 게시물을 찾음
    if (post) {
        const comment = {
            id: commentId++,  // 고유한 댓글 ID 생성
            content: req.body.content  // 요청 본문에서 댓글 내용을 가져와 설정
        };
        post.comments.push(comment);  // 해당 게시물의 댓글 배열에 새 댓글 추가
        res.status(201).json(comment);  // 상태 코드 201과 함께 새 댓글을 응답
    } else {
        res.status(404).json({ error: 'Post not found' });  // 게시물을 찾지 못한 경우 404 응답
    }
});

// 댓글 목록 조회
app.get('/posts/:postId/comments', (req, res) => {
    const post = posts.find(p => p.id === parseInt(req.params.postId));  // 게시물 ID로 게시물을 찾음
    if (post) {
        res.json(post.comments);  // 게시물의 댓글 배열을 JSON 형식으로 응답
    } else {
        res.status(404).json({ error: 'Post not found' });  // 게시물을 찾지 못한 경우 404 응답
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);  // 서버가 실행 중임을 콘솔에 출력
});
