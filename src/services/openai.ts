// src/api/openai.ts
import axios from "axios";

const openai = axios.create({
  baseURL: import.meta.env.VITE_OPENAI_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
  },
});

export default openai;
