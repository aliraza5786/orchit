// socket.ts
import { io } from "socket.io-client";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


const token = localStorage.getItem("token");

export const socket = io(API_BASE_URL, {
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

  on(event: string, cb: any) {
    socket.on(event, cb);
  }

  off(event: string, cb?: any) {
    socket.off(event, cb);
  }

  removeListener(event: string) {
    socket.removeAllListeners(event);
  }
}

const userSocket = new WSService();
export default userSocket;
