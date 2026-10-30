
import { useEffect, useRef, useState } from "react";
import "./VisualizerDemo.css";

type Mode = "bars" | "wave" | "circular";

export default function VisualizerDemo() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const frameRef = useRef<number>(0);
  const urlRef = useRef<string | null>(null);

  const [mode, setMode] = useState<Mode>("bars");
  const [fileName, setFileName] = useState("");
  const [playing, setPlaying] = useState(false);

  function chooseFile(file?: File) {
    if (!file || !audioRef.current) return;

    if (urlRef.current) URL.revokeObjectURL(urlRef.current);

    const url = URL.createObjectURL(file);
    urlRef.current = url;

    audioRef.current.pause();
    audioRef.current.src = url;
    audioRef.current.load();

    setFileName(file.name);
    setPlaying(false);
  }

  async function togglePlay() {
    const audio = audioRef.current;
    if (!audio || !audio.src) return;

    try {
      if (!contextRef.current) {
        const context = new AudioContext();
        const analyser = context.createAnalyser();

        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.82;

        const source = context.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(context.destination);

        contextRef.current = context;
        analyserRef.current = analyser;
        sourceRef.current = source;
      }

      await contextRef.current.resume();

      if (audio.paused) {
        await audio.play();
        setPlaying(true);
      } else {
        audio.pause();
        setPlaying(false);
      }
    } catch (error) {
      console.error("Không thể phát nhạc:", error);
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (!canvas || !ctx) return;

    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      width = rect.width;
      height = rect.height;

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      const analyser = analyserRef.current;
      if (!analyser) {
        frameRef.current = requestAnimationFrame(draw);
        return;
      }

      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);

      ctx.fillStyle = "#A99AFF";
      ctx.strokeStyle = "#A99AFF";
      ctx.lineWidth = 2;

      if (mode === "bars") {
        const count = 48;
        const gap = 4;
        const barWidth = Math.max(1, width / count - gap);

        for (let i = 0; i < count; i++) {
          const value = data[i] / 255;
          const barHeight = Math.max(3, value * height * 0.85);
          const x = i * (width / count);
          const y = (height - barHeight) / 2;

          ctx.globalAlpha = 0.5 + value * 0.5;
          ctx.beginPath();
          ctx.roundRect(
            x,
            y,
            barWidth,
            barHeight,
            barWidth / 2,
          );
          ctx.fill();
        }

        ctx.globalAlpha = 1;
      }

      if (mode === "wave") {
        const wave = new Uint8Array(analyser.fftSize);
        analyser.getByteTimeDomainData(wave);

        ctx.beginPath();

        for (let i = 0; i < wave.length; i++) {
          const x = (i / (wave.length - 1)) * width;
          const y = (wave[i] / 255) * height;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.stroke();
      }

      if (mode === "circular") {
        const count = 64;
        const cx = width / 2;
        const cy = height / 2;
        const radius = Math.min(width, height) * 0.2;

        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2;
          const value = data[i] / 255;
          const length = 5 + value * radius * 0.65;

          const x1 = cx + Math.cos(angle) * radius;
          const y1 = cy + Math.sin(angle) * radius;
          const x2 = cx + Math.cos(angle) * (radius + length);
          const y2 = cy + Math.sin(angle) * (radius + length);

          ctx.globalAlpha = 0.45 + value * 0.55;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }

        ctx.globalAlpha = 1;
      }

      frameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(frameRef.current);
      observer.disconnect();
    };
  }, [mode]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onEnded = () => setPlaying(false);
    audio.addEventListener("ended", onEnded);

    return () => audio.removeEventListener("ended", onEnded);
  }, []);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(frameRef.current);
      audioRef.current?.pause();

      sourceRef.current?.disconnect();
      analyserRef.current?.disconnect();

      void contextRef.current?.close();

      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  return (
    <main className="visualizer-demo">
      <header className="visualizer-header">
        <div>
          <p className="visualizer-eyebrow">AUREON LAB</p>
          <h1>Song Visualizer</h1>
          <p className="visualizer-subtitle">
            Một cách đơn giản để cảm nhận âm thanh.
          </p>
        </div>
      </header>

      <section className="visualizer-panel">
        <div className="visualizer-top">
          <div>
            <p className="visualizer-label">NOW PLAYING</p>
            <h2>{fileName || "Chưa chọn bài hát"}</h2>
          </div>

          <label className="visualizer-upload">
            Chọn nhạc
            <input
              type="file"
              accept="audio/*"
              onChange={(event) =>
                chooseFile(event.target.files?.[0])
              }
            />
          </label>
        </div>

        <canvas
          ref={canvasRef}
          className="visualizer-canvas"
        />

        <div className="visualizer-controls">
          <button
            className="visualizer-play"
            onClick={togglePlay}
            disabled={!fileName}
          >
            {playing ? "Tạm dừng" : "Phát nhạc"}
          </button>

          <div className="visualizer-modes">
            {(["bars", "wave", "circular"] as const).map(
              (item) => (
                <button
                  key={item}
                  className={mode === item ? "active" : ""}
                  onClick={() => setMode(item)}
                >
                  {item === "bars"
                    ? "Bars"
                    : item === "wave"
                      ? "Wave"
                      : "Circular"}
                </button>
              ),
            )}
          </div>
        </div>

        <audio
          ref={audioRef}
          preload="metadata"
          onPause={() => setPlaying(false)}
          onPlay={() => setPlaying(true)}
        />
      </section>
    </main>
  );
}
