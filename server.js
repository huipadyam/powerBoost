const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const app = express();
const PORT = 3000;

const prisma = new PrismaClient();

app.use(bodyParser.json());

const JWT_SECRET = 's3cR3t_k3y_w1th_$pec1al_Char@ct3r$';
const REFRESH_SECRET = 'r3fR3sh_s3cR3t_k3y';

// Middleware to verify token
function verifyToken(req, res, next) {
    const token = req.headers['x-access-token'];
    if (!token) {
        return res.status(403).send('토큰이 제공되지 않았습니다');
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(500).send('토큰 인증 실패');
        }

        req.userId = decoded.id;
        req.nickname = decoded.nickname;
        next();
    });
}

// 회원가입 엔드포인트
app.post('/register', async (req, res) => {
    const { username, password, nickname } = req.body;
    if (!username || !password || !nickname) {
        return res.status(400).send('필수 필드를 입력하세요');
    }

    const hashedPassword = bcrypt.hashSync(password, 8);

    try {
        await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                nickname
            }
        });
        res.status(201).send('회원가입 성공');
    } catch (err) {
        console.error('회원가입 오류:', err);
        res.status(500).send('회원가입 오류');
    }
});

// 로그인 엔드포인트
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).send('필수 필드를 입력하세요');
    }

    try {
        const user = await prisma.user.findUnique({
            where: { username }
        });

        if (!user) {
            return res.status(404).send('사용자를 찾을 수 없습니다');
        }

        const passwordIsValid = bcrypt.compareSync(password, user.password);

        if (!passwordIsValid) {
            return res.status(401).send('비밀번호가 일치하지 않습니다');
        }

        const token = jwt.sign({ id: user.id, nickname: user.nickname }, JWT_SECRET, { expiresIn: '15m' });
        const refreshToken = jwt.sign({ id: user.id, nickname: user.nickname }, REFRESH_SECRET, { expiresIn: '7d' });

        res.status(200).send({ auth: true, token, refreshToken });
    } catch (err) {
        console.error('로그인 오류:', err);
        res.status(500).send('로그인 오류');
    }
});

// 토큰 갱신 엔드포인트
app.post('/token', (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(401).send('토큰이 제공되지 않았습니다');
    }

    jwt.verify(refreshToken, REFRESH_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send('유효하지 않은 토큰입니다');
        }

        const newToken = jwt.sign({ id: decoded.id, nickname: decoded.nickname }, JWT_SECRET, { expiresIn: '15m' });
        res.status(200).send({ token: newToken });
    });
});

// 글 작성 엔드포인트
app.post('/posts', verifyToken, async (req, res) => {
    const { title, content } = req.body;
    if (!title || !content) {
        return res.status(400).send('제목과 내용을 입력하세요');
    }

    try {
        await prisma.post.create({
            data: {
                userId: req.userId,
                title,
                content
            }
        });
        res.status(201).send('글 작성 성공');
    } catch (err) {
        console.error('글 작성 오류:', err);
        res.status(500).send('글 작성 오류');
    }
});

// 글 수정 엔드포인트
app.put('/posts/:id', verifyToken, async (req, res) => {
    const { title, content } = req.body;
    const { id } = req.params;
    if (!title || !content) {
        return res.status(400).send('제목과 내용을 입력하세요');
    }

    try {
        const post = await prisma.post.findUnique({
            where: { id: parseInt(id) }
        });

        if (!post || post.userId !== req.userId) {
            return res.status(404).send('게시물을 찾을 수 없습니다');
        }

        await prisma.post.update({
            where: { id: parseInt(id) },
            data: { title, content }
        });
        res.status(200).send('글 수정 성공');
    } catch (err) {
        console.error('글 수정 오류:', err);
        res.status(500).send('글 수정 오류');
    }
});

// 글 삭제 엔드포인트
app.delete('/posts/:id', verifyToken, async (req, res) => {
    const { id } = req.params;

    try {
        const post = await prisma.post.findUnique({
            where: { id: parseInt(id) }
        });

        if (!post || post.userId !== req.userId) {
            return res.status(404).send('게시물을 찾을 수 없습니다');
        }

        await prisma.post.delete({
            where: { id: parseInt(id) }
        });
        res.status(200).send('글 삭제 성공');
    } catch (err) {
        console.error('글 삭제 오류:', err);
        res.status(500).send('글 삭제 오류');
    }
});

// 글 목록 조회 엔드포인트
app.get('/posts', async (req, res) => {
    try {
        const posts = await prisma.post.findMany();
        res.status(200).json(posts);
    } catch (err) {
        console.error('글 목록 조회 오류:', err);
        res.status(500).send('글 목록 조회 오류');
    }
});

// 글 상세 조회 엔드포인트
app.get('/posts/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const post = await prisma.post.findUnique({
            where: { id: parseInt(id) }
        });

        if (!post) {
            return res.status(404).send('게시물을 찾을 수 없습니다');
        }

        res.status(200).json(post);
    } catch (err) {
        console.error('글 조회 오류:', err);
        res.status(500).send('글 조회 오류');
    }
});

// 좋아요 기능 엔드포인트
app.post('/posts/:id/like', verifyToken, async (req, res) => {
    const { id } = req.params;

    try {
        const post = await prisma.post.findUnique({
            where: { id: parseInt(id) }
        });

        if (!post) {
            return res.status(404).send('게시물을 찾을 수 없습니다');
        }

        await prisma.post.update({
            where: { id: parseInt(id) },
            data: { likes: post.likes + 1 }
        });
        res.status(200).send('좋아요 성공');
    } catch (err) {
        console.error('좋아요 업데이트 오류:', err);
        res.status(500).send('좋아요 업데이트 오류');
    }
});

// 댓글 작성 엔드포인트
app.post('/posts/:postId/comments', verifyToken, async (req, res) => {
    const { content } = req.body;
    const { postId } = req.params;
    if (!content) {
        return res.status(400).send('내용을 입력하세요');
    }

    try {
        await prisma.comment.create({
            data: {
                postId: parseInt(postId),
                userId: req.userId,
                content,
                userNick: req.nickname
            }
        });
        res.status(201).send('댓글 작성 성공');
    } catch (err) {
        console.error('댓글 작성 오류:', err);
        res.status(500).send('댓글 작성 오류');
    }
});

// 댓글 목록 조회 엔드포인트
app.get('/posts/:postId/comments', async (req, res) => {
    const { postId } = req.params;

    try {
        const comments = await prisma.comment.findMany({
            where: { postId: parseInt(postId) }
        });
        res.status(200).json(comments);
    } catch (err) {
        console.error('댓글 조회 오류:', err);
        res.status(500).send('댓글 조회 오류');
    }
});

// 스크랩 기능 엔드포인트
app.post('/posts/:id/scrap', verifyToken, async (req, res) => {
    const { id } = req.params;

    try {
        const post = await prisma.post.findUnique({
            where: { id: parseInt(id) }
        });

        if (!post) {
            return res.status(404).send('게시물을 찾을 수 없습니다');
        }

        await prisma.scrap.create({
            data: {
                postId: parseInt(id),
                userId: req.userId
            }
        });
        res.status(200).send('스크랩 성공');
    } catch (err) {
        console.error('스크랩 오류:', err);
        res.status(500).send('스크랩 오류');
    }
});

// 게시물 검색 기능 엔드포인트
app.get('/search', async (req, res) => {
    const { query } = req.query;
    if (!query) {
        return res.status(400).send('검색어를 입력하세요');
    }

    try {
        const posts = await prisma.post.findMany({
            where: {
                OR: [
                    { title: { contains: query } },
                    { content: { contains: query } }
                ]
            }
        });
        res.status(200).json(posts);
    } catch (err) {
        console.error('게시물 검색 오류:', err);
        res.status(500).send('게시물 검색 오류');
    }
});

// 서버 실행
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
