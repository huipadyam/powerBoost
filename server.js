const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

// MySQL 데이터베이스 연결 설정
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'mydatabase'
});

db.connect(err => {
    if (err) {
        console.error('MySQL 연결 오류:', err);
    } else {
        console.log('MySQL에 연결되었습니다.');
    }
});

// 비밀 키
const JWT_SECRET = 's3cR3t_k3y_w1th_$pec1al_Char@ct3r$';

// 회원가입
app.post('/register', (req, res) => {
    const { username, password, nickname } = req.body;
    if (!username || !password || !nickname) {
        return res.status(400).send('필수 필드를 입력하세요');
    }

    const hashedPassword = bcrypt.hashSync(password, 8);

    db.query(
        'INSERT INTO users (username, password, nickname) VALUES (?, ?, ?)',
        [username, hashedPassword, nickname],
        (err, result) => {
            if (err) {
                console.error('회원가입 오류:', err);
                return res.status(500).send('회원가입 오류');
            }
            res.status(201).send('회원가입 성공');
        }
    );
});

// 로그인
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).send('필수 필드를 입력하세요');
    }

    db.query(
        'SELECT * FROM users WHERE username = ?',
        [username],
        (err, results) => {
            if (err) {
                console.error('로그인 오류:', err);
                return res.status(500).send('로그인 오류');
            }

            if (results.length === 0) {
                return res.status(404).send('사용자를 찾을 수 없습니다');
            }

            const user = results[0];
            const passwordIsValid = bcrypt.compareSync(password, user.password);

            if (!passwordIsValid) {
                return res.status(401).send('비밀번호가 일치하지 않습니다');
            }

            const token = jwt.sign({ id: user.id, nickname: user.nickname }, JWT_SECRET, {
                expiresIn: 86400 // 24시간
            });

            res.status(200).send({ auth: true, token });
        }
    );
});

// 미들웨어로 토큰 인증
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

// 글 작성
app.post('/posts', verifyToken, (req, res) => {
    const { title, content } = req.body;
    if (!title || !content) {
        return res.status(400).send('제목과 내용을 입력하세요');
    }

    db.query(
        'INSERT INTO posts (user_id, title, content) VALUES (?, ?, ?)',
        [req.userId, title, content],
        (err, result) => {
            if (err) {
                console.error('글 작성 오류:', err);
                return res.status(500).send('글 작성 오류');
            }
            res.status(201).send('글 작성 성공');
        }
    );
});

// 글 수정
app.put('/posts/:id', verifyToken, (req, res) => {
    const { title, content } = req.body;
    const { id } = req.params;
    if (!title || !content) {
        return res.status(400).send('제목과 내용을 입력하세요');
    }

    db.query(
        'SELECT * FROM posts WHERE id = ? AND user_id = ?',
        [id, req.userId],
        (err, results) => {
            if (err) {
                console.error('글 수정 오류:', err);
                return res.status(500).send('글 수정 오류');
            }

            if (results.length === 0) {
                return res.status(404).send('게시물을 찾을 수 없습니다');
            }

            db.query(
                'UPDATE posts SET title = ?, content = ? WHERE id = ?',
                [title, content, id],
                (err, result) => {
                    if (err) {
                        console.error('글 수정 오류:', err);
                        return res.status(500).send('글 수정 오류');
                    }
                    res.status(200).send('글 수정 성공');
                }
            );
        }
    );
});

// 글 삭제
app.delete('/posts/:id', verifyToken, (req, res) => {
    const { id } = req.params;

    db.query(
        'SELECT * FROM posts WHERE id = ? AND user_id = ?',
        [id, req.userId],
        (err, results) => {
            if (err) {
                console.error('글 삭제 오류:', err);
                return res.status(500).send('글 삭제 오류');
            }

            if (results.length === 0) {
                return res.status(404).send('게시물을 찾을 수 없습니다');
            }

            db.query(
                'DELETE FROM posts WHERE id = ?',
                [id],
                (err, result) => {
                    if (err) {
                        console.error('글 삭제 오류:', err);
                        return res.status(500).send('글 삭제 오류');
                    }
                    res.status(200).send('글 삭제 성공');
                }
            );
        }
    );
});

// 글 목록 조회
app.get('/posts', (req, res) => {
    db.query('SELECT * FROM posts', (err, results) => {
        if (err) {
            console.error('글 목록 조회 오류:', err);
            return res.status(500).send('글 목록 조회 오류');
        }
        res.status(200).json(results);
    });
});

// 글 상세 조회
app.get('/posts/:id', (req, res) => {
    const { id } = req.params;

    db.query(
        'SELECT * FROM posts WHERE id = ?',
        [id],
        (err, results) => {
            if (err) {
                console.error('글 조회 오류:', err);
                return res.status(500).send('글 조회 오류');
            }

            if (results.length === 0) {
                return res.status(404).send('게시물을 찾을 수 없습니다');
            }

            res.status(200).json(results[0]);
        }
    );
});

// 좋아요 기능
app.post('/posts/:id/like', verifyToken, (req, res) => {
    const { id } = req.params;

    db.query(
        'SELECT * FROM posts WHERE id = ?',
        [id],
        (err, results) => {
            if (err) {
                console.error('좋아요 오류:', err);
                return res.status(500).send('좋아요 오류');
            }

            if (results.length === 0) {
                return res.status(404).send('게시물을 찾을 수 없습니다');
            }

            db.query(
                'UPDATE posts SET likes = likes + 1 WHERE id = ?',
                [id],
                (err, result) => {
                    if (err) {
                        console.error('좋아요 업데이트 오류:', err);
                        return res.status(500).send('좋아요 업데이트 오류');
                    }
                    res.status(200).send('좋아요 성공');
                }
            );
        }
    );
});

// 댓글 작성
app.post('/posts/:postId/comments', verifyToken, (req, res) => {
    const { content } = req.body;
    const { postId } = req.params;
    if (!content) {
        return res.status(400).send('내용을 입력하세요');
    }

    db.query(
        'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
        [postId, req.userId, content],
        (err, result) => {
            if (err) {
                console.error('댓글 작성 오류:', err);
                return res.status(500).send('댓글 작성 오류');
            }
            res.status(201).send('댓글 작성 성공');
        }
    );
});

// 댓글 목록 조회
app.get('/posts/:postId/comments', (req, res) => {
    const { postId } = req.params;

    db.query(
        'SELECT * FROM comments WHERE post_id = ?',
        [postId],
        (err, results) => {
            if (err) {
                console.error('댓글 조회 오류:', err);
                return res.status(500).send('댓글 조회 오류');
            }
            res.status(200).json(results);
        }
    );
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
