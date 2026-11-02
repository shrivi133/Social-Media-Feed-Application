import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

export default function App() {
  const [posts, setPosts] = useState([]);
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [commentText, setCommentText] = useState({});

  useEffect(() => {
    fetch('http://localhost:5000/api/posts')
      .then(res => res.json())
      .then(data => setPosts(data))
      .catch(() => {});

    socket.on('post_created', (post) => setPosts(prev => [post, ...prev]));
    socket.on('post_updated', (updated) => {
      setPosts(prev => prev.map(p => p._id === updated._id ? updated : p));
    });

    return () => socket.disconnect();
  }, []);

  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!content || !author) return;
    socket.emit('new_post', { author, content, likes: 0, comments: [] });
    setContent('');
  };

  const handleLike = (id) => socket.emit('like_post', id);

  const handleAddComment = (id) => {
    if (!commentText[id]) return;
    socket.emit('add_comment', { id, author: author || 'Anonymous', text: commentText[id] });
    setCommentText({ ...commentText, [id]: '' });
  };

  return (
    <div style={{ maxWidth: '600px', margin: '20px auto', fontFamily: 'sans-serif' }}>
      <h2>Social Media Feed (Real-Time)</h2>
      <form onSubmit={handleCreatePost} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
        <input placeholder="Your Name" value={author} onChange={e => setAuthor(e.target.value)} />
        <textarea placeholder="What's happening?" value={content} onChange={e => setContent(e.target.value)} />
        <button type="submit">Post</button>
      </form>

      <div>
        {posts.map(p => (
          <div key={p._id} style={{ border: '1px solid #ddd', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
            <strong>{p.author}</strong>
            <p>{p.content}</p>
            <button onClick={() => handleLike(p._id)}>❤️ {p.likes}</button>
            
            <div style={{ marginTop: '10px' }}>
              <h5>Comments:</h5>
              {p.comments?.map((c, i) => <div key={i}><small><strong>{c.author}:</strong> {c.text}</small></div>)}
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                <input 
                  placeholder="Write a comment..." 
                  value={commentText[p._id] || ''} 
                  onChange={e => setCommentText({ ...commentText, [p._id]: e.target.value })} 
                />
                <button onClick={() => handleAddComment(p._id)}>Reply</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}