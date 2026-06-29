# MediaHub

A Dev.to-style blogging platform backend — Posts, Users, Comments, Tags, and Likes.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in your real values:
   ```
   cp .env.example .env
   ```

3. Run the server:
   ```
   npm run dev
   ```

## Endpoints

**Auth**
- `POST /api/auth/signup`
- `POST /api/auth/login`

**Posts**
- `GET /api/posts`
- `GET /api/posts/:id`
- `POST /api/posts` (auth required)
- `PUT /api/posts/:id` (auth required)
- `DELETE /api/posts/:id` (auth required)
- `POST /api/posts/:id/like` (auth required)

**Comments**
- `GET /api/comments/:postId`
- `POST /api/comments/:postId` (auth required)
- `DELETE /api/comments/:id` (auth required)

**Tags**
- `GET /api/tags`
- `POST /api/tags` (auth required)

## Auth header format

```
Authorization: Bearer <token>
```
