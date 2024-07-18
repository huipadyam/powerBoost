const express = require('express');  // Express 모듈을 가져와서 express 변수에 할당
// import express from 'express'; : commonJS module 문법보다 ES 모듈 문법으로 통일해서 쓰는게 좋음
const bodyParser = require('body-parser');  // body-parser 모듈을 가져와서 bodyParser 변수에 할당
// import bodyParser from 'body-parser';
const mysql = require('mysql2');  // MySQL 모듈을 가져와서 mysql 변수에 할당
// import mysql from 'mysql2';
const bcrypt = require('bcryptjs');  // bcrypt 모듈을 가져와서 bcrypt 변수에 할당
// import bcrypt from 'bcryptjs';
const jwt = require('jsonwebtoken');  // jsonwebtoken 모듈을 가져와서 jwt 변수에 할당
// import jwt from 'jsonwebtoken';

const app = express();  // Express 애플리케이션 인스턴스를 생성하여 app 변수에 할당
const PORT = 3000;  // 서버가 실행될 포트를 3000으로 설정

app.use(bodyParser.json());  // JSON 형식의 요청 본문을 파싱하기 위해 body-parser 미들웨어를 사용

// MySQL 데이터베이스 연결 설정
const db = mysql.createConnection({
    host: 'localhost',  // 데이터베이스 호스트
    user: 'root',  // 데이터베이스 사용자 이름
    password: 'root',  // 데이터베이스 비밀번호
    database: 'mydatabase'  // 사용할 데이터베이스 이름
});

// MySQL 데이터베이스에 연결
db.connect(err => {
    if (err) {
        console.error('MySQL 연결 오류:', err);  // 연결 오류 발생 시 콘솔에 오류 메시지 출력
    } else {
        console.log('MySQL에 연결되었습니다.');  // 연결 성공 시 콘솔에 성공 메시지 출력
    }
});

// 비밀 키
const JWT_SECRET = 's3cR3t_k3y_w1th_$pec1al_Char@ct3r$';

// 회원가입 엔드포인트
app.post('/register', (req, res) => {
    const { username, password, nickname } = req.body;  // 요청 본문에서 username, password, nickname 추출
    if (!username || !password || !nickname) {
        return res.status(400).send('필수 필드를 입력하세요');  // 필수 필드가 누락된 경우 400 응답
    }

    const hashedPassword = bcrypt.hashSync(password, 8);  // 비밀번호를 해시 처리

    // 데이터베이스에 사용자 정보 삽입
    db.query(
        'INSERT INTO users (username, password, nickname) VALUES (?, ?, ?)',
        [username, hashedPassword, nickname],
        (err, result) => {
            if (err) {
                console.error('회원가입 오류:', err);  // 삽입 오류 발생 시 콘솔에 오류 메시지 출력
                return res.status(500).send('회원가입 오류');  // 500 응답
            }
            res.status(201).send('회원가입 성공');  // 성공 시 201 응답
        }
    );
});

// 로그인 엔드포인트
app.post('/login', (req, res) => {
    const { username, password } = req.body;  // 요청 본문에서 username, password 추출
    if (!username || !password) {
        return res.status(400).send('필수 필드를 입력하세요');  // 필수 필드가 누락된 경우 400 응답
    }

    // 데이터베이스에서 사용자 정보 조회
    db.query(
        'SELECT * FROM users WHERE username = ?',
        [username],
        (err, results) => {
            if (err) {
                console.error('로그인 오류:', err);  // 조회 오류 발생 시 콘솔에 오류 메시지 출력
                return res.status(500).send('로그인 오류');  // 500 응답
            }

            if (results.length === 0) {
                return res.status(404).send('사용자를 찾을 수 없습니다');  // 사용자가 존재하지 않는 경우 404 응답
            }

            const user = results[0];  // 사용자 정보 추출
            const passwordIsValid = bcrypt.compareSync(password, user.password);  // 비밀번호 검증

            if (!passwordIsValid) {
                return res.status(401).send('비밀번호가 일치하지 않습니다');  // 비밀번호가 일치하지 않는 경우 401 응답
            }

            // JWT 생성
            const token = jwt.sign({ id: user.id, nickname: user.nickname }, JWT_SECRET, {
                expiresIn: 86400  // 토큰 유효 기간을 24시간으로 설정
            });

            res.status(200).send({ auth: true, token });  // 성공 시 200 응답과 토큰 반환
        }
    );
});

// 미들웨어로 토큰 인증
function verifyToken(req, res, next) {
    const token = req.headers['x-access-token'];  // 요청 헤더에서 토큰 추출
    if (!token) {
        return res.status(403).send('토큰이 제공되지 않았습니다');  // 토큰이 없는 경우 403 응답
    }

    // 토큰 검증
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(500).send('토큰 인증 실패');  // 토큰 인증 실패 시 500 응답
        }

        req.userId = decoded.id;  // 검증된 토큰에서 사용자 ID 추출
        req.nickname = decoded.nickname;  // 검증된 토큰에서 사용자 닉네임 추출
        next();  // 다음 미들웨어로 이동
    });
}

// 글 작성 엔드포인트
app.post('/posts', verifyToken, (req, res) => {
    const { title, content } = req.body;  // 요청 본문에서 title, content 추출
    if (!title || !content) {
        return res.status(400).send('제목과 내용을 입력하세요');  // 필수 필드가 누락된 경우 400 응답
    }

    // 데이터베이스에 게시글 정보 삽입
    db.query(
        'INSERT INTO posts (user_id, title, content) VALUES (?, ?, ?)',
        [req.userId, title, content],
        (err, result) => {
            if (err) {
                console.error('글 작성 오류:', err);  // 삽입 오류 발생 시 콘솔에 오류 메시지 출력
                return res.status(500).send('글 작성 오류');  // 500 응답
            }
            res.status(201).send('글 작성 성공');  // 성공 시 201 응답
        }
    );
});

// 글 수정 엔드포인트
app.put('/posts/:id', verifyToken, (req, res) => {
    const { title, content } = req.body;  // 요청 본문에서 title, content 추출
    const { id } = req.params;  // URL 파라미터에서 게시글 ID 추출
    if (!title || !content) {
        return res.status(400).send('제목과 내용을 입력하세요');  // 필수 필드가 누락된 경우 400 응답
    }

    // 데이터베이스에서 게시글 정보 조회
    db.query(
        'SELECT * FROM posts WHERE id = ? AND user_id = ?',
        [id, req.userId],
        (err, results) => {
            if (err) {
                console.error('글 수정 오류:', err);  // 조회 오류 발생 시 콘솔에 오류 메시지 출력
                return res.status(500).send('글 수정 오류');  // 500 응답
            }

            if (results.length === 0) {
                return res.status(404).send('게시물을 찾을 수 없습니다');  // 게시물이 존재하지 않는 경우 404 응답
            }

            // 게시글 정보 업데이트
            db.query(
                'UPDATE posts SET title = ?, content = ? WHERE id = ?',
                [title, content, id],
                (err, result) => {
                    if (err) {
                        console.error('글 수정 오류:', err);  // 업데이트 오류 발생 시 콘솔에 오류 메시지 출력
                        return res.status(500).send('글 수정 오류');  // 500 응답
                    }
                    res.status(200).send('글 수정 성공');  // 성공 시 200 응답
                }
            );
        }
    );
});

// 글 삭제 엔드포인트
app.delete('/posts/:id', verifyToken, (req, res) => {
    const { id } = req.params;  // URL 파라미터에서 게시글 ID 추출

    // 데이터베이스에서 게시글 정보 조회
    db.query(
        'SELECT * FROM posts WHERE id = ? AND user_id = ?',
        [id, req.userId],
        (err, results) => {
            if (err) {
                console.error('글 삭제 오류:', err);  // 조회 오류 발생 시 콘솔에 오류 메시지 출력
                return res.status(500).send('글 삭제 오류');  // 500 응답
            }

            if (results.length === 0) {
                return res.status(404).send('게시물을 찾을 수 없습니다');  // 게시물이 존재하지 않는 경우 404 응답
            }

            // 게시글 정보 삭제
            db.query(
                'DELETE FROM posts WHERE id = ?',
                [id],
                (err, result) => {
                    if (err) {
                        console.error('글 삭제 오류:', err);  // 삭제 오류 발생 시 콘솔에 오류 메시지 출력
                        return res.status(500).send('글 삭제 오류');  // 500 응답
                    }
                    res.status(200).send('글 삭제 성공');  // 성공 시 200 응답
                }
            );
        }
    );
});

// 글 목록 조회 엔드포인트
app.get('/posts', (req, res) => {
    // 데이터베이스에서 모든 게시글 조회
    db.query('SELECT * FROM posts', (err, results) => {
        if (err) {
            console.error('글 목록 조회 오류:', err);  // 조회 오류 발생 시 콘솔에 오류 메시지 출력
            return res.status(500).send('글 목록 조회 오류');  // 500 응답
        }
        res.status(200).json(results);  // 성공 시 200 응답과 조회된 게시글 반환
    });
});

// 글 상세 조회 엔드포인트
app.get('/posts/:id', (req, res) => {
    const { id } = req.params;  // URL 파라미터에서 게시글 ID 추출

    // 데이터베이스에서 게시글 정보 조회
    db.query(
        'SELECT * FROM posts WHERE id = ?',
        [id],
        (err, results) => {
            if (err) {
                console.error('글 조회 오류:', err);  // 조회 오류 발생 시 콘솔에 오류 메시지 출력
                return res.status(500).send('글 조회 오류');  // 500 응답
            }

            if (results.length === 0) {
                return res.status(404).send('게시물을 찾을 수 없습니다');  // 게시물이 존재하지 않는 경우 404 응답
            }

            res.status(200).json(results[0]);  // 성공 시 200 응답과 조회된 게시글 반환
        }
    );
});

// 좋아요 기능 엔드포인트
app.post('/posts/:id/like', verifyToken, (req, res) => {
    const { id } = req.params;  // URL 파라미터에서 게시글 ID 추출

    // 데이터베이스에서 게시글 정보 조회
    db.query(
        'SELECT * FROM posts WHERE id = ?',
        [id],
        (err, results) => {
            if (err) {
                console.error('좋아요 오류:', err);  // 조회 오류 발생 시 콘솔에 오류 메시지 출력
                return res.status(500).send('좋아요 오류');  // 500 응답
            }

            if (results.length === 0) {
                return res.status(404).send('게시물을 찾을 수 없습니다');  // 게시물이 존재하지 않는 경우 404 응답
            }

            // 게시글의 좋아요 수 업데이트
            db.query(
                'UPDATE posts SET likes = likes + 1 WHERE id = ?',
                [id],
                (err, result) => {
                    if (err) {
                        console.error('좋아요 업데이트 오류:', err);  // 업데이트 오류 발생 시 콘솔에 오류 메시지 출력
                        return res.status(500).send('좋아요 업데이트 오류');  // 500 응답
                    }
                    res.status(200).send('좋아요 성공');  // 성공 시 200 응답
                }
            );
        }
    );
});

// 댓글 작성 엔드포인트
app.post('/posts/:postId/comments', verifyToken, (req, res) => {
    const { content } = req.body;  // 요청 본문에서 content 추출
    const { postId } = req.params;  // URL 파라미터에서 게시글 ID 추출
    if (!content) {
        return res.status(400).send('내용을 입력하세요');  // 필수 필드가 누락된 경우 400 응답
    }

    // 데이터베이스에 댓글 정보 삽입
    db.query(
        'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
        [postId, req.userId, content],
        (err, result) => {
            if (err) {
                console.error('댓글 작성 오류:', err);  // 삽입 오류 발생 시 콘솔에 오류 메시지 출력
                return res.status(500).send('댓글 작성 오류');  // 500 응답
            }
            res.status(201).send('댓글 작성 성공');  // 성공 시 201 응답
        }
    );
});

// 댓글 목록 조회 엔드포인트
app.get('/posts/:postId/comments', (req, res) => {
    const { postId } = req.params;  // URL 파라미터에서 게시글 ID 추출

    // 데이터베이스에서 댓글 정보 조회
    db.query(
        'SELECT * FROM comments WHERE post_id = ?',
        [postId],
        (err, results) => {
            if (err) {
                console.error('댓글 조회 오류:', err);  // 조회 오류 발생 시 콘솔에 오류 메시지 출력
                return res.status(500).send('댓글 조회 오류');  // 500 응답
            }
            res.status(200).json(results);  // 성공 시 200 응답과 조회된 댓글 반환
        }
    );
});

// 서버 실행
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);  // 서버가 실행되면 콘솔에 메시지 출력
});
