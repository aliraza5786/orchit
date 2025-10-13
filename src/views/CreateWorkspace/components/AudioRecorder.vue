<template>
    <div :class="[
        '',
        isRecording ? 'relative' : ` ${propClass.class} `
    ]">
        <canvas ref="canvasRef" class="w-full h-12 rounded-xl p-3 bg-bg-surface" v-show="isRecording"></canvas>
        <div v-if="isRecording" class="absolute top-3 left-2 text-xs text-accent ml-2 mt-1">
            {{ Math.floor(recordingTime / 60) }}:{{ (recordingTime % 60).toString().padStart(2, '0') }}
        </div>

        <button v-if="!audioURL" @click="toggleRecording" :class="[
            ' text-sm overflow-hidden',
            isRecording ? 'text-red-500 mt-1  absolute right-2 top-1' : 'text-text-primary'
        ]">
            <template v-if="isRecording">
                <div
                    class="w-8 h-8 aspect-square rounded-lg  cursor-pointer  bg-accent  p-2 flex items-center justify-center ">
                    <div class="w-2 bg-white h-2 aspect-square"></div>
                </div>

            </template>
            <template v-else>

                <div class="w-8 h-8 aspect-square rounded-lg bg-accent flex justify-center items-center text-center cursor-pointer   ">
                    <i  class="text-white fa-solid fa-microphone font-base" > </i>

                </div>

            </template>
            <!-- Audio Preview -->

        </button>





        <p v-if="isPending && audioURL" class="text-text-secondary">Transcribing...</p>
        <p v-if="isError && audioURL" class="text-red-500">Transcription failed.</p>
        <p v-if="data && audioURL" class="text-white mt-2 text-sm">
            <strong>Transcirpt:</strong> {{ data }}
        </p>
    </div>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount, watch, nextTick } from "vue";
import { useWhisperTranscription } from "../../../queries/useOpenAIGeneration";
// import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";


const emit = defineEmits(['transcribed', 'update:isRecording', 'update:hasAudio']);

const propClass = defineProps({
    class: {
        type: String,
        default: ''
    }
});
const recordingTime = ref(0);
let timerInterval: number | null = null;
const recordedBlob = ref<Blob | null>(null);
const audioURL = ref<string | null>(null);
const isRecording = ref(false);
const canvasRef = ref<HTMLCanvasElement | null>(null);
let audioChunks: BlobPart[] = [];
let mediaRecorder: MediaRecorder | null = null;

const { mutate, data, isPending, isError } = useWhisperTranscription({
    onSuccess: (data: any) => {
        emit('update:isRecording', false);
        emit('update:hasAudio', false);


        emit('transcribed', data)
    }
});

watch(data, (newText) => {
    if (newText) {
        emit('transcribed', newText);
    }
});

// Web Audio API
let audioContext: AudioContext | null = null;
let analyser: AnalyserNode;
let dataArray: Uint8Array;
let animationId: number;
let frameCounter = 0;
const insertEveryNFrames = 3; // 👈 increase to slow down (higher = slower)
const audio = ref<HTMLAudioElement | null>(null);
const isPlaying = ref(false);
const currentTime = ref(0);

const historyLength = 200; // how many bars on screen
const volumeHistory = new Array(historyLength).fill(0); // sliding volume buffer

const drawWave = () => {
    if (!canvasRef.value || !analyser) return;
    const canvas = canvasRef.value;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    analyser.getByteFrequencyData(dataArray);
    const avg = dataArray.reduce((sum, v) => sum + v, 0) / dataArray.length;
    const normalized = (avg / 255) * 0.8;

    // Throttle how often we push new values
    frameCounter++;
    if (frameCounter % insertEveryNFrames === 0) {
        volumeHistory.push(normalized);
        if (volumeHistory.length > historyLength) volumeHistory.shift();
    }

    // Clear canvas and draw center line
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const centerY = canvas.height / 2;

    ctx.strokeStyle = "var(--accent)";
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(canvas.width, centerY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw waveform bars
    const barWidth = 1;
    const gap = 1;
    const totalBarWidth = barWidth + gap;
    const offsetX = canvas.width - volumeHistory.length * totalBarWidth;


    ctx.fillStyle = "var(--accent)";

    volumeHistory.forEach((v, i) => {
        const barHeight = v * canvas.height * 1;
        const x = offsetX + i * totalBarWidth;

        ctx.fillRect(x, centerY - barHeight, barWidth, barHeight || 5);
        ctx.fillRect(x, centerY, barWidth, barHeight || 5);
    });

    animationId = requestAnimationFrame(drawWave);
};



const stopWave = () => {
    cancelAnimationFrame(animationId);
    audioContext?.close();
    audioContext = null;
};

const toggleRecording = async () => {
    if (isRecording.value) {
        mediaRecorder?.stop();
        stopWave();
        isRecording.value = false;

        // 🔴 Stop timer
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    } else {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) audioChunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(audioChunks, { type: "audio/webm" }); // ✅ move here
            recordedBlob.value = blob;
            audioURL.value = URL.createObjectURL(blob);

            const file = new File([blob], "recording.webm", { type: "audio/webm" });
            mutate(file);

            audio.value = new Audio(audioURL.value);

            audio.value.addEventListener("timeupdate", () => {
                currentTime.value = Math.floor(audio.value!.currentTime);
            });

            audio.value.addEventListener("ended", () => {
                isPlaying.value = false;
                currentTime.value = 0;
            });
            audioURL.value = URL.createObjectURL(blob);
            audio.value = new Audio(audioURL.value);

            audio.value.addEventListener('timeupdate', () => {
                currentTime.value = Math.floor(audio.value!.currentTime);
            });

            audio.value.addEventListener('ended', () => {
                isPlaying.value = false;
            });
        };

        // Web Audio
        audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        dataArray = new Uint8Array(analyser.frequencyBinCount);
        source.connect(analyser);
        drawWave();
        mediaRecorder.start();
        isRecording.value = true;

        // 🟢 Start timer
        recordingTime.value = 0;
        timerInterval = setInterval(() => {
            recordingTime.value++;
        }, 1000);
    }
};


// preview 
const previewCanvasRef = ref<HTMLCanvasElement | null>(null);


const drawPreviewWave = () => {
    if (!previewCanvasRef.value || !recordedBlob.value) return;

    const canvas = previewCanvasRef.value;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Resize canvas
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    // Simulate a static waveform with random bars (or load actual waveform data if needed)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const centerY = canvas.height / 2;
    const barCount = 300;
    const barWidth = 2;
    const gap = 2;

    for (let i = 0; i < barCount; i++) {
        const barHeight = Math.random() * canvas.height * 0.6 + 4;
        const x = i * (barWidth + gap);
        ctx.fillStyle = "white"; // Tailwind green-500
        ctx.fillRect(x, centerY - barHeight / 2, barWidth, barHeight);
    }
};

watch(audioURL, (val) => {
    if (val) {
        emit('update:hasAudio', true);

        nextTick(drawPreviewWave);
    } else {
        emit('update:hasAudio', false);
    }
});


watch(isRecording, (newText) => {
    if (newText) {
        emit('update:isRecording', newText);
    }
});

onBeforeUnmount(() => {
    stopWave();
});
</script>