import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

const app = express();
app.use(
  cors({
    orgin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(
  express.json({
    limit: '16kb',
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '16kb',
  })
);

// routes
app.use(cookieParser());


import userRouter from './routes/user.routes.js';

// routes decalartion

app.use('/api/v1/users', userRouter);

app.use(express.static('public'));
export { app };
