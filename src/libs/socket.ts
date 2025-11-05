import { io } from "socket.io-client";

const token = localStorage.getItem("token"); // or your storage key

export const socket = io(import.meta.env.VITE_API_BASE_URL, {
  transports: ["websocket"],
  withCredentials: true,
  auth: {
    token: token ? `Bearer ${token}` : undefined,
  },
});

socket.on("connect", () => {
  console.log("✅ Socket connected:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.warn("❌ Socket disconnected:", reason);
});
