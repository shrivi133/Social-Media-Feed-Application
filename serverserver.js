import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

mongoose.connect('mongodb://127.0.0.1:27017/socialfeed')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error(err));

const postSchema = new mongoose.Schema({
  author: String,
  content: String,
  likes: { type: Number, default: 0 },
  comments: [{ author: String, text: String }]
});

const Post = mongoose.model('Post', postSchema);

// REST Endpoints
app.get('/api/posts', async (req, res) => res.json(await Post.find()));

// Real-time WebSockets
io.on('connection', (socket) => {
  socket.on('new_post', async (data) => {
    const post = await Post.create(data);
    io.emit('post_created', post);
  });

  socket.on('like_post', async (id) => {
    const post = await Post.findByIdAndUpdate(id, { $inc: { likes: 1 } }, { new: true });
    io.emit('post_updated', post);
  });

  socket.on('add_comment', async ({ id, author, text }) => {
    const post = await Post.findByIdAndUpdate(id, { $push: { comments: { author, text } } }, { new: true });
    io.emit('post_updated', post);
  });
});

server.listen(5000, () => console.log('Social backend running on port 5000'));