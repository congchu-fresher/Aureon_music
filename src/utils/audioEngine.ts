/**
 * Resilient Audio Engine for AUREON
 * Provides seamless HTML5 Audio playback combined with Web Audio AnalyserNode
 * for real-time waveform visualizers, with an instant synthetic fallback generator
 * if external audio streams encounter CORS or network blocks.
 */

import { useEffect, useRef } from "react";

class AudioEngine {
  private audio = new Audio();
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private synthInterval: number | null = null;
  private isSynthetic: boolean = false;
  private synthTime: number = 0;
  private synthDuration: number = 180;
  private synthGain: GainNode | null = null;
  private playRequestId = 0;
  private onTimeUpdateCallback: ((time: number, duration: number) => void) | null = null;
  private onEndCallback: (() => void) | null = null;
  private onPlayStateChangeCallback: ((isPlaying: boolean) => void) | null = null;
  private onErrorCallback: ((msg: string) => void) | null = null;


constructor() {
  // Phải đặt CORS trước khi gán URL MP3.
  this.audio.crossOrigin = "anonymous";
  this.audio.preload = "auto";

  // Đăng ký sự kiện đúng một lần.
  this.setupListeners();
}

private ensureAudioContext(): AnalyserNode {
  if (!this.audioCtx) {
    this.audioCtx = new AudioContext();
  }

  if (!this.analyser) {
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;
  }

  // Một HTMLAudioElement chỉ nên được tạo source một lần
  if (!this.sourceNode) {
    this.sourceNode =
      this.audioCtx.createMediaElementSource(this.audio);

    this.sourceNode.connect(this.analyser);
    this.analyser.connect(this.audioCtx.destination);
  }

  return this.analyser;
}

async playUrl(url: string): Promise<void> {
  if (!url || !/^https:\/\//i.test(url)) {
    throw new Error("URL nhạc không hợp lệ.");
  }

  const analyser = this.ensureAudioContext();

  // Khởi động AudioContext sau thao tác bấm Play của người dùng
  if (this.audioCtx?.state === "suspended") {
    await this.audioCtx.resume();
  }

  

  if (this.audio.src !== url) {
    this.audio.pause();
    this.audio.src = url;
    this.audio.load();
  }

  // Dùng chính audio element này cho mọi bài hát
  void analyser;
  await this.audio.play();
}

getAnalyser(): AnalyserNode | null {
  return this.analyser;
}

  public hasSource(): boolean {
  return !!(
    this.audio &&
    (this.audio.currentSrc || this.audio.src)
  );
}

  private setupListeners() {
    if (!this.audio) return;

    this.audio.addEventListener('timeupdate', () => {
      if (this.onTimeUpdateCallback && this.audio) {
        this.onTimeUpdateCallback(this.audio.currentTime, this.audio.duration || 0);
      }
    });

    this.audio.addEventListener('ended', () => {
      if (this.onEndCallback) {
        this.onEndCallback();
      }
    });

    this.audio.addEventListener('play', () => {
      if (this.onPlayStateChangeCallback) {
        this.onPlayStateChangeCallback(true);
      }
    });

    this.audio.addEventListener('pause', () => {
      if (this.onPlayStateChangeCallback && !this.isSynthetic) {
        this.onPlayStateChangeCallback(false);
      }
    });

    this.audio.addEventListener("error", () => {
  if (!this.audio) return;

  console.error("[AudioEngine] Audio element error:", {
    src: this.audio.currentSrc || this.audio.src,
    code: this.audio.error?.code,
    message: this.audio.error?.message,
  });
});
}

  public setCallbacks(
    onTimeUpdate: (time: number, duration: number) => void,
    onEnd: () => void,
    onPlayStateChange: (isPlaying: boolean) => void,
    onError: (msg: string) => void
  ) {
    this.onTimeUpdateCallback = onTimeUpdate;
    this.onEndCallback = onEnd;
    this.onPlayStateChangeCallback = onPlayStateChange;
    this.onErrorCallback = onError;
  }



public async loadAndPlay(
  url: string,
  durationSeconds: number = 210,
  delayMs: number = 350
) {
  const requestId = ++this.playRequestId;

  this.stopSyntheticAudio();
  this.isSynthetic = false;

  const audio = this.audio;

  if (!audio) {
    this.onErrorCallback?.("Trình duyệt không hỗ trợ Audio.");
    return;
  }

  audio.pause();
  audio.currentTime = 0;
  audio.removeAttribute("src");
  audio.load();

  this.synthTime = 0;
  this.synthDuration = durationSeconds;

  this.onTimeUpdateCallback?.(0, durationSeconds);
  this.onPlayStateChangeCallback?.(false);

  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, delayMs);
  });

  if (requestId !== this.playRequestId) return;

  if (!url || url.startsWith("synth://")) {
    this.ensureAudioContext();
    this.startSyntheticAudio();
    return;
  }

  try {
    audio.src = url;

    // Không gọi audio.load() thêm lần nữa ở đây.
    this.ensureAudioContext();

    if (this.audioCtx?.state === "suspended") {
      await this.audioCtx.resume();
    }

    await audio.play();

    if (requestId !== this.playRequestId) {
      audio.pause();
      return;
    }

    console.log("[AudioEngine] Trạng thái sau khi phát:", {
      paused: audio.paused,
      muted: audio.muted,
      volume: audio.volume,
      currentTime: audio.currentTime,
      readyState: audio.readyState,
      audioContextState: this.audioCtx?.state,
    });

    this.isSynthetic = false;
    this.onPlayStateChangeCallback?.(true);
  } catch (error) {
    if (requestId !== this.playRequestId) return;

    const message =
      error instanceof Error ? error.message : String(error);

    console.error("[AudioEngine] Không thể phát nhạc:", {
      url,
      message,
      code: audio.error?.code,
      mediaError: audio.error?.message,
      readyState: audio.readyState,
      networkState: audio.networkState,
      audioContextState: this.audioCtx?.state,
    });

    audio.pause();
    this.isSynthetic = false;
    this.onPlayStateChangeCallback?.(false);

    this.onErrorCallback?.(
      `Không thể phát bài nhạc: ${message}`
    );
  }
}



  private startSyntheticAudio() {
    this.isSynthetic = true;
    this.stopSyntheticAudio();
    this.ensureAudioContext();

    if (this.audio) {
      this.audio.pause();
    }

    if (this.onPlayStateChangeCallback) this.onPlayStateChangeCallback(true);

    // Generate soothing ambient chord intervals using Web Audio oscillator
    const playChordPulse = () => {
      if (!this.audioCtx || !this.isSynthetic) return;
      try {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        
        // Pentatonic frequencies: C4, D4, E4, G4, A4, C5
        const freqs = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
        const freq = freqs[Math.floor(Math.random() * freqs.length)];
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

        gain.gain.setValueAtTime(0.001, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.04, this.audioCtx.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 1.2);

        if (this.analyser) {
          gain.connect(this.analyser);
        } else {
          gain.connect(this.audioCtx.destination);
        }
        osc.connect(gain);

        osc.start();
        osc.stop(this.audioCtx.currentTime + 1.3);
      } catch {
        // ignore
      }
    };

    // Trigger pulse every 1.5s
    playChordPulse();
    this.synthInterval = window.setInterval(() => {
      this.synthTime += 0.5;
      if (this.synthTime % 1.5 < 0.5) {
        playChordPulse();
      }
      if (this.onTimeUpdateCallback) {
        this.onTimeUpdateCallback(this.synthTime, this.synthDuration);
      }
      if (this.synthTime >= this.synthDuration) {
        this.stopSyntheticAudio();
        if (this.onEndCallback) this.onEndCallback();
      }
    }, 500);
  }

  public pause() {
    if (this.isSynthetic) {
      if (this.synthInterval) {
        clearInterval(this.synthInterval);
        this.synthInterval = null;
      }
      if (this.onPlayStateChangeCallback) this.onPlayStateChangeCallback(false);
    } else if (this.audio) {
      this.audio.pause();
    }
  }

public async resume() {
  try {
    this.ensureAudioContext();

    if (this.audioCtx?.state === "suspended") {
      await this.audioCtx.resume();
    }

    if (this.isSynthetic) {
      if (!this.synthInterval) {
        this.startSyntheticAudio();
      }
      return;
    }

    await this.audio.play();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);

    console.error("[AudioEngine] Không thể tiếp tục phát:", message);
    this.onPlayStateChangeCallback?.(false);
    this.onErrorCallback?.(`Không thể tiếp tục phát nhạc: ${message}`);
  }
}

  public seek(seconds: number) {
    if (this.isSynthetic) {
      this.synthTime = Math.max(0, Math.min(seconds, this.synthDuration));
      if (this.onTimeUpdateCallback) {
        this.onTimeUpdateCallback(this.synthTime, this.synthDuration);
      }
    } else if (this.audio && !isNaN(this.audio.duration)) {
      this.audio.currentTime = Math.max(0, Math.min(seconds, this.audio.duration));
    }
  }

  public setVolume(vol: number) {
    const clamped = Math.max(0, Math.min(1, vol));
    if (this.audio) {
      this.audio.volume = clamped;
    }
    if (this.synthGain && this.audioCtx) {
      this.synthGain.gain.setValueAtTime(clamped * 0.05, this.audioCtx.currentTime);
    }
  }


public getVisualizerData(): number[] {
  const BAR_COUNT = 32;

  if (!this.analyser) {
    return Array(BAR_COUNT).fill(0);
  }

  const bufferLength = this.analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  this.analyser.getByteFrequencyData(dataArray);

  const bars: number[] = [];
  const step = Math.max(1, Math.floor(bufferLength / BAR_COUNT));

  for (let i = 0; i < BAR_COUNT; i++) {
    const start = i * step;
    const end = Math.min(start + step, bufferLength);

    let total = 0;
    let count = 0;

    for (let j = start; j < end; j++) {
      total += dataArray[j];
      count++;
    }

    bars.push(count > 0 ? total / count : 0);
  }

  return bars;
}


  private stopSyntheticAudio() {
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
  }

 public destroy() {
  // Vô hiệu hóa mọi yêu cầu phát đang chờ
  this.playRequestId++;

  this.stopSyntheticAudio();
  this.isSynthetic = false;

  if (this.audio) {
    this.audio.pause();
    this.audio.removeAttribute("src");
    this.audio.load();
  }

  if (this.sourceNode) {
    try {
      this.sourceNode.disconnect();
    } catch {
      // Node có thể đã ngắt kết nối
    }

    this.sourceNode = null;
  }

  if (this.audioCtx) {
    this.audioCtx.close().catch(() => {});
    this.audioCtx = null;
    this.analyser = null;
    this.synthGain = null;
  }
}

  public stopCurrentAudio() {
  // Hủy mọi yêu cầu phát bài trước đó để không có yêu cầu cũ tự phát lại.
  this.playRequestId++;

  // Dừng âm thanh tổng hợp nếu đang dùng chế độ dự phòng.
  this.stopSyntheticAudio();
  this.isSynthetic = false;
  this.synthTime = 0;

  // Dừng và tua về đầu nhưng giữ src hiện tại để nút Phát có thể phát lại bài này.
  if (this.audio) {
    this.audio.pause();
    try {
      this.audio.currentTime = 0;
    } catch {
      // Metadata có thể chưa tải; lần phát tiếp theo sẽ đặt lại tiến trình.
    }
  }

  // Làm mới giao diện trình phát.
  this.onTimeUpdateCallback?.(0, this.audio?.duration || this.synthDuration || 0);
  this.onPlayStateChangeCallback?.(false);
}
}

export const globalAudioEngine = new AudioEngine();
