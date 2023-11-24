import React, { useCallback, useEffect, useState } from 'react'
import { useSocket } from '../context/SocketProvider'
import peer from '../services/peer';
import ReactPlayer from "react-player";
import './Room.css';

const Room = () => {

    const socket = useSocket()
    const [socketRemoteId, setSocketRemoteId] = useState(null);
    const [myStream ,setMyStream ] = useState(null)
    const [remoteStream, setRemoteStream] = useState();


    const handleUserJoined = useCallback((data)=>{

        const {email , id} = data
        setSocketRemoteId(id);
        console.log(email ,id)
    },[])

    const handleCallUser = useCallback(async () => {


        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,})

            const offer = await peer.getOffer();

            socket.emit("user:call", { to: socketRemoteId, offer });

            setMyStream(stream)
        }
        
        ,[socketRemoteId, socket]);

        const sendStreams = useCallback(() => {
          for (const track of myStream.getTracks()) {
            peer.peer.addTrack(track, myStream);
          }
        }, [myStream]);

        const handleCallAccepted = useCallback(
          ({ from, ans }) => {
            peer.setLocalDescription(ans);
            console.log("Call Accepted!");
            sendStreams();
            
          },
          [sendStreams]
        );

       const handleIncommingCall = useCallback(async({from , offer})=>{
        setSocketRemoteId(from)
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,})
          setMyStream(stream)
              console.log("Incomming call",from , offer)
              const ans = await peer.getAnswer(offer)

          socket.emit("call:accepted", {to: from, ans})   
       },[socket])

       const handleNegoNeedFinal = useCallback(async ({ ans }) => {
        await peer.setLocalDescription(ans);
      }, []);

       const handleNegoNeeded = useCallback(async () => {
        const offer = await peer.getOffer();
        socket.emit("peer:nego:needed", { offer, to: socketRemoteId });
      }, [socketRemoteId, socket]);
    
      useEffect(() => {
        peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
        return () => {
          peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
        };
      }, [handleNegoNeeded]);

      const handleNegoNeedIncomming = useCallback(
        async ({ from, offer }) => {
          const ans = await peer.getAnswer(offer);
          socket.emit("peer:nego:done", { to: from, ans });
        },
        [socket]
      );


       useEffect(() => {
        peer.peer.addEventListener("track", async (ev) => {
          const remoteStream = ev.streams;
          console.log("GOT TRACKS!!");
          setRemoteStream(remoteStream[0]);
        });
      }, []);


    useEffect(
        ()=>{
            socket.on("user:joined", handleUserJoined)

            socket.on("incomming:call", handleIncommingCall);

            socket.on("call:accepted", handleCallAccepted);


            socket.on("peer:nego:needed", handleNegoNeedIncomming);

            socket.on("peer:nego:final", handleNegoNeedFinal);



            return ()=>{
                socket.off("user:joined", handleUserJoined)
                socket.off("incomming:call", handleIncommingCall);
                socket.off("call:accepted", handleCallAccepted);
                socket.off("peer:nego:needed", handleNegoNeedIncomming);
                socket.off("peer:nego:final", handleNegoNeedFinal);
            }
        },[socket, handleUserJoined,handleIncommingCall,handleCallAccepted,handleNegoNeedIncomming,handleNegoNeedFinal]

    
    )
    return (
      <div className="room-container">
        <div className="center-content">
          <h1>Room</h1>
          <h4>{socketRemoteId ? 'Connected' : 'NO user is Joined'}</h4>
          {myStream && <button onClick={sendStreams}>Send Stream</button>}
          {socketRemoteId && <button onClick={handleCallUser}>CALL</button>}
          <div className="streams-container">
            {myStream && (
              <div className="stream">
                <h1>User 1</h1>
                <ReactPlayer playing muted height="" width="100%" url={myStream} />
              </div>
            )}
            {remoteStream && (
              <div className="stream">
                <h1>User 2</h1>
                <ReactPlayer playing muted height="" width="100%" url={remoteStream} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

export default Room