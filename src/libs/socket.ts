// libs/socket.ts
import { io, Socket } from "socket.io-client";
const API_BASE_URL = import.meta.env.VITE_SOCKET_IO_URL;
let _socket: Socket | null = null;

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);

  if (parts.length === 2) {
    return parts.pop()?.split(";").shift();
  }

  return null;
}

export function getSocket(): Socket {
  if (!_socket) {
    const token = localStorage.getItem("token") || getCookie("space_auth"); // Try localStorage first, then fallback to cookie
    console.log(
      "🔌 Creating socket — token present:",
      !!token,
      "| URL:",
      API_BASE_URL,
    );

    _socket = io(API_BASE_URL, {
      transports: ["websocket"],
      withCredentials: true,
      autoConnect: false, // KEY FIX: don't connect until we call .connect()
      auth: { token: token ?? undefined },
    });

    // Attach listeners immediately at creation — never miss an event
    _socket.on("connect", () => {
      console.log("✅ Socket Connected:", _socket?.id);
    });
    _socket.on("disconnect", (reason) => {
      console.log("❌ Socket Disconnected:", reason);
    });
    _socket.on("connect_error", (err) => {
      console.error("⚠️ Socket Connection Error:", err.message);
    });
  }
  return _socket;
}

export function connectSocket() {
  const token = localStorage.getItem("token");
  if (!token) {
    console.warn("⚠️ connectSocket() called but no token in localStorage");
    return;
  }

  const sock = getSocket();

  // Update auth token in case it changed since socket was created
  sock.auth = { token };

  if (sock.connected) {
    console.log("ℹ️ Socket already connected:", sock.id);
    return;
  }

  console.log("🚀 Connecting socket with token:", token.slice(0, 20) + "...");
  sock.connect();
}

export function resetSocket() {
  if (_socket) {
    console.log("🔄 Resetting socket");
    _socket.removeAllListeners();
    _socket.disconnect();
    _socket = null;
  }
}

// ─── WSService ────────────────────────────────────────────────────────────────
class WSService {
  initializeSocket() {
    console.log("📡 initializeSocket() called");
    connectSocket(); // ✅ explicit connect — not implicit at creation
  }

  emit(event: string, data?: any, cb?: Function) {
    getSocket().emit(event, data, cb);
  }

  on(event: string, cb: any) {
    getSocket().on(event, cb);
  }

  off(event: string, cb?: any) {
    getSocket().off(event, cb);
  }

  removeListener(event: string) {
    getSocket().removeAllListeners(event);
  }
}

const userSocket = new WSService();
export default userSocket;
