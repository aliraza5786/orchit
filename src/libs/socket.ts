// socket.ts
import { io } from "socket.io-client";

const token = localStorage.getItem("token");

export const socket = io('https://backend.streamed.space/', {
  transports: ["websocket"],
  withCredentials: true,
  auth: {
    token: token ? `${token}` : undefined,
  },
});
  
// service
class WSService {
  initializeSocket() {
    console.log("Initializing Socket...");
    console.log(token, '>>> token ');

    socket.on("connect", () => {
      console.log("✅ Socket Connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket Disconnected");
    });

    socket.on("connect_error", (err) => {
      console.log("⚠️ Socket Connection Error:", err.message);
    });
  }

  emit(event: string, data?: any, cb?: Function) {
    socket.emit(event, data, cb);
  }

  on(event: string, cb: Function) {
    socket.on(event, cb);
  }

  off(event: string, cb?: Function) {
    socket.off(event, cb);
  }

  removeListener(event: string) {
    socket.removeAllListeners(event);
  }
}

const userSocket = new WSService();
export default userSocket;
