import { useEffect, useRef } from "react"
import { io } from "socket.io-client"

const SOCKET_URL = "http://localhost:5000"

export default function useHeistSocket({
  setRoomId,
  setCurrentUserRole,
  setHeistBackendState,
}) {
  const socketRef = useRef(null)

  useEffect(() => {
    const socket = io(SOCKET_URL)
    socketRef.current = socket

    socket.on("connect", () => {
      console.log("Heist socket connected:", socket.id)

      socket.emit("heist:join-queue", {
        name: "Player",
      })
    })

    socket.on("heist:matched", ({ roomId, role, room }) => {
      console.log("Matched in heist:", roomId, role)

      setRoomId(roomId)
      setCurrentUserRole(role)
      setHeistBackendState(room)
    })

    socket.on("heist:update", (room) => {
      setHeistBackendState(room)
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  return socketRef
}