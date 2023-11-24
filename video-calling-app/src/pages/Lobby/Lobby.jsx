import React, { useCallback, useEffect, useState } from 'react';
import { useSocket } from '../../context/SocketProvider';
import { useNavigate } from 'react-router-dom';
import './Lobby.css'; // Import your CSS file

const Lobby = () => {
  const [email, setEmail] = useState('');
  const [room, setRoom] = useState('');
  const socket = useSocket();
  const navigate = useNavigate();

  const formHandler = useCallback(
    (e) => {
      e.preventDefault();
      socket.emit('hello', { email, room });
    },
    [email, room, socket]
  );

  const handleJoinRoom = useCallback(
    (data) => {
      const { email, room } = data;
      navigate(`/room/${room}`);
    },
    [navigate]
  );

  useEffect(() => {
    socket.on('room:join', handleJoinRoom);
    return () => {
      socket.off('room:join', handleJoinRoom);
    };
  }, [socket, handleJoinRoom]);

  return (
    <div className="lobby-container">
      <h1>Lobby</h1>
      <form onSubmit={formHandler}>
        <label htmlFor="email">Email ID</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          id="email"
        />
        <br />
        <label htmlFor="room">Room Number</label>
        <input
          type="text"
          id="room"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
        />
        <br />
        <button>Join Room</button>
      </form>
    </div>
  );
};

export default Lobby;
