const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;

app.use(bodyParser.json());

let posts = [];
let postId = 1;
let commentId = 1;

// 글 작성
app.post('/posts', (req, res) => {
    const post = {
        id: postId++,
        title: req.body.title,
        content: req.body.content,
        likes: 0,
        comments: []
    };
    posts.push(post);
    res.status(201).json(post);
});

// 글 수정
app.put('/posts/:id', (req, res) => {
    const post = posts.find(p => p.id === parseInt(req.params.id));
    if (post) {
        post.title = req.body.title || post.title;
        post.content = req.body.content || post.content;
        res.json(post);
    } else {
        res.status(404).json({ error: 'Post not found' });
    }
});

// 글 삭제
app.delete('/posts/:id', (req, res) => {
    posts = posts.filter(p => p.id !== parseInt(req.params.id));
    res.status(204).end();
});

// 글 목록 조회
app.get('/posts', (req, res) => {
    res.json(posts);
});

// 글 상세 조회
app.get('/posts/:id', (req, res) => {
    const post = posts.find(p => p.id === parseInt(req.params.id));
    if (post) {
        res.json(post);
    } else {
        res.status(404).json({ error: 'Post not found' });
    }
});

// 좋아요 기능
app.post('/posts/:id/like', (req, res) => {
    const post = posts.find(p => p.id === parseInt(req.params.id));
    if (post) {
        post.likes++;
        res.json({ likes: post.likes });
    } else {
        res.status(404).json({ error: 'Post not found' });
    }
});

// 댓글 작성
app.post('/posts/:postId/comments', (req, res) => {
    const post = posts.find(p => p.id === parseInt(req.params.postId));
    if (post) {
        const comment = {
            id: commentId++,
            content: req.body.content
        };
        post.comments.push(comment);
        res.status(201).json(comment);
    } else {
        res.status(404).json({ error: 'Post not found' });
    }
});

// 댓글 목록 조회
app.get('/posts/:postId/comments', (req, res) => {
    const post = posts.find(p => p.id === parseInt(req.params.postId));
    if (post) {
        res.json(post.comments);
    } else {
        res.status(404).json({ error: 'Post not found' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
