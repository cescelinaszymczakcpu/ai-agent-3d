"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const clamp01 = (v) => Math.max(0, Math.min(1, v));

function analyse(analyser, timeData, freqData) {
  if (!analyser) return { rms: 0, low: 0, mid: 0, high: 0 };

  analyser.getByteTimeDomainData(timeData);
  let sum = 0;
  for (let i = 0; i < timeData.length; i += 1) {
    const v = (timeData[i] - 128) / 128;
    sum += v * v;
  }
  const rms = clamp01(Math.sqrt(sum / timeData.length) * 4.8);

  analyser.getByteFrequencyData(freqData);
  const n = freqData.length;
  const avg = (from, to) => {
    let total = 0;
    let count = 0;
    for (let i = from; i < to; i += 1) {
      total += freqData[i] / 255;
      count += 1;
    }
    return count ? total / count : 0;
  };

  return {
    rms,
    low: clamp01(avg(1, Math.max(2, Math.floor(n * 0.12))) * 1.8),
    mid: clamp01(avg(Math.floor(n * 0.12), Math.floor(n * 0.42)) * 1.55),
    high: clamp01(avg(Math.floor(n * 0.42), Math.floor(n * 0.88)) * 1.75),
  };
}

export default function useOpenAIRealtimeVoice(variant = "female") {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [phase, setPhase] = useState("idle");
  const [audioLevel, setAudioLevel] = useState(0);
  const [audioBands, setAudioBands] = useState({ low: 0, mid: 0, high: 0 });
  const [error, setError] = useState("");

  const pcRef = useRef(null);
  const dcRef = useRef(null);
  const micRef = useRef(null);
  const audioRef = useRef(null);
  const ctxRef = useRef(null);
  const localAnalyserRef = useRef(null);
  const remoteAnalyserRef = useRef(null);
  const rafRef = useRef(0);
  const speakingHoldRef = useRef(0);
  const phaseRef = useRef("idle");
  const variantRef = useRef(variant);

  const setPhaseSafe = useCallback((next) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;

    try { dcRef.current?.close(); } catch {}
    try { pcRef.current?.close(); } catch {}
    micRef.current?.getTracks?.().forEach((track) => track.stop());
    try { ctxRef.current?.close(); } catch {}

    if (audioRef.current) {
      try { audioRef.current.pause(); } catch {}
      audioRef.current.srcObject = null;
    }

    dcRef.current = null;
    pcRef.current = null;
    micRef.current = null;
    ctxRef.current = null;
    localAnalyserRef.current = null;
    remoteAnalyserRef.current = null;
    speakingHoldRef.current = 0;

    setConnected(false);
    setConnecting(false);
    setAudioLevel(0);
    setAudioBands({ low: 0, mid: 0, high: 0 });
    setPhaseSafe("idle");
  }, [setPhaseSafe]);

  const startMeters = useCallback(() => {
    const localTime = new Uint8Array(512);
    const localFreq = new Uint8Array(256);
    const remoteTime = new Uint8Array(512);
    const remoteFreq = new Uint8Array(256);
    let smoothed = 0;
    let smoothBands = { low: 0, mid: 0, high: 0 };

    const tick = () => {
      const local = analyse(localAnalyserRef.current, localTime, localFreq);
      const remote = analyse(remoteAnalyserRef.current, remoteTime, remoteFreq);
      const now = performance.now();

      if (remote.rms > 0.035) {
        speakingHoldRef.current = now + 220;
        if (phaseRef.current !== "speaking") setPhaseSafe("speaking");
      } else if (phaseRef.current === "speaking" && now > speakingHoldRef.current) {
        setPhaseSafe("listening");
      }

      const useRemote = phaseRef.current === "speaking" || remote.rms > 0.025;
      const source = useRemote ? remote : local;
      smoothed += (source.rms - smoothed) * (useRemote ? 0.34 : 0.24);
      smoothBands = {
        low: smoothBands.low + (source.low - smoothBands.low) * 0.28,
        mid: smoothBands.mid + (source.mid - smoothBands.mid) * 0.28,
        high: smoothBands.high + (source.high - smoothBands.high) * 0.28,
      };

      setAudioLevel((prev) => Math.abs(prev - smoothed) > 0.006 ? smoothed : prev);
      setAudioBands((prev) =>
        Math.abs(prev.low - smoothBands.low) + Math.abs(prev.mid - smoothBands.mid) + Math.abs(prev.high - smoothBands.high) > 0.018
          ? { ...smoothBands }
          : prev
      );

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [setPhaseSafe]);

  const start = useCallback(async () => {
    if (connected) return true;
    if (connecting) return false;

    setError("");
    setConnecting(true);
    setPhaseSafe("connecting");
    variantRef.current = variant;

    try {
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      const audio = document.createElement("audio");
      audio.autoplay = true;
      audio.playsInline = true;
      audioRef.current = audio;

      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      ctxRef.current = ctx;
      if (ctx.state === "suspended") await ctx.resume();

      const mic = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      micRef.current = mic;
      pc.addTrack(mic.getAudioTracks()[0], mic);

      const localSource = ctx.createMediaStreamSource(mic);
      const localAnalyser = ctx.createAnalyser();
      localAnalyser.fftSize = 512;
      localAnalyser.smoothingTimeConstant = 0.68;
      localSource.connect(localAnalyser);
      localAnalyserRef.current = localAnalyser;

      pc.ontrack = async (event) => {
        const stream = event.streams[0];
        audio.srcObject = stream;
        try { await audio.play(); } catch {}

        const remoteSource = ctx.createMediaStreamSource(stream);
        const remoteAnalyser = ctx.createAnalyser();
        remoteAnalyser.fftSize = 512;
        remoteAnalyser.smoothingTimeConstant = 0.62;
        remoteSource.connect(remoteAnalyser);
        remoteAnalyserRef.current = remoteAnalyser;
      };

      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      const channelReady = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("OpenAI Realtime data channel timeout.")), 12000);
        dc.addEventListener("open", () => {
          clearTimeout(timeout);
          setConnected(true);
          setConnecting(false);
          setPhaseSafe("listening");
          resolve(true);
        }, { once: true });
        dc.addEventListener("error", () => {
          clearTimeout(timeout);
          reject(new Error("OpenAI Realtime data channel error."));
        }, { once: true });
      });

      dc.addEventListener("message", (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "input_audio_buffer.speech_started" && phaseRef.current !== "speaking") {
            setPhaseSafe("listening");
          }
          if (data.type === "input_audio_buffer.speech_stopped" && phaseRef.current !== "speaking") {
            setPhaseSafe("thinking");
          }
          if (data.type === "response.created" && phaseRef.current !== "speaking") {
            setPhaseSafe("thinking");
          }
          if (data.type === "response.done" && phaseRef.current !== "speaking") {
            setPhaseSafe("listening");
          }
          if (data.type === "error") {
            setError(data.error?.message || "OpenAI Realtime error");
          }
        } catch {}
      });

      dc.addEventListener("close", () => {
        setConnected(false);
        if (phaseRef.current !== "idle") setPhaseSafe("idle");
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const response = await fetch(`/api/realtime?variant=${variant === "male" ? "male" : "female"}`, {
        method: "POST",
        body: offer.sdp,
        headers: { "Content-Type": "application/sdp" },
      });

      if (!response.ok) {
        let detail = "";
        try {
          const json = await response.json();
          detail = json.detail || json.error || "";
        } catch {
          detail = await response.text();
        }
        throw new Error(detail || `Realtime connection failed (${response.status})`);
      }

      const answerSdp = await response.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
      startMeters();
      await channelReady;
      return true;
    } catch (err) {
      const message = err?.message || "Nie udało się uruchomić OpenAI Realtime.";
      stop();
      setError(message);
      return false;
    }
  }, [connected, connecting, setPhaseSafe, startMeters, stop, variant]);

  const sendText = useCallback((text) => {
    const dc = dcRef.current;
    if (!dc || dc.readyState !== "open" || !text?.trim()) return false;

    dc.send(JSON.stringify({
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [{ type: "input_text", text: text.trim() }],
      },
    }));
    dc.send(JSON.stringify({ type: "response.create", response: { output_modalities: ["audio"] } }));
    setPhaseSafe("thinking");
    return true;
  }, [setPhaseSafe]);

  const startAndSend = useCallback(async (text) => {
    const ready = connected ? true : await start();
    if (!ready) return false;
    return sendText(text);
  }, [connected, sendText, start]);

  useEffect(() => () => stop(), [stop]);

  useEffect(() => {
    if (connected && variantRef.current !== variant) stop();
  }, [variant, connected, stop]);

  return {
    connected,
    connecting,
    phase,
    audioLevel,
    audioBands,
    error,
    start,
    stop,
    sendText,
    startAndSend,
    voice: variant === "male" ? "cedar" : "marin",
  };
}
