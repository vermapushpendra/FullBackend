import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));

//If doing any configuration then use app.use()
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true, limit: "20kb" }));
app.use(express.static("public"));
//Cookie Parser
app.use(cookieParser());

//routes import as userRouter not simple router
import userRouter from './routes/user.routes.js';

import videoRouter from './routes/video.routes.js';

import subscriptionRouter from './routes/subscription.routes.js'

import playlistRouter from './routes/playlist.routes.js'

import commentRouter from './routes/comment.routes.js'

import likeRouter from './routes/like.routes.js'

import dashboardRouter from './routes/dashboard.routes.js'

import healthcheckRouther from './routes/healthcheck.routes.js'

// Middleware for handling user routes
app.use('/api/v1/users', userRouter);

app.use('/api/v1/videos', videoRouter)

app.use('/api/v1/subscriptions', subscriptionRouter)

app.use('/api/v1/playlists', playlistRouter)

app.use('/api/v1/comments', commentRouter)

app.use('/api/v1/likes', likeRouter)

app.use('/api/v1/dashboards', dashboardRouter)

app.use('/api/v1/healthchecks', healthcheckRouther)


export { app };

