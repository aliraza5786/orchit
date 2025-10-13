// src/queries/useOpenAIGeneration.ts
import { useMutation } from "@tanstack/vue-query";
import openai from "../services/openai";

interface OpenAIResponse {
  choices: { message: { content: string } }[];
}

export const useOpenAIGeneration = (options = {}) => {
  return useMutation({
    mutationFn: async (prompt: string): Promise<string> => {
      const response = await openai.post<OpenAIResponse>("/chat/completions", {
        model: "gpt-4.1", // or "gpt-3.5-turbo"
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      });

      return response.data.choices[0].message.content;
    },
    ...options,
  });
};

export const useWhisperTranscription = (options = {}) => {
  return useMutation({
    mutationFn: async (file: File): Promise<string> => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("model", "whisper-1");
      formData.append("response_format", "json");

      const response = await openai.post("/audio/transcriptions", formData, {
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data.text;
    },
    ...options,
  });
};
