import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

import { LAppLive2DManager } from './lapplive2dmanager';

const greetings = [
  /こんにちは/,
  /こんにちわ/,
  /今日は/,
  /おはよう/,
  /こんばんは/,
  /やっほ/,
  /もしもし/,
  /안녕/,
  /hello/i
];

const greetingText = 'こんにちは！会えてうれしいな。今日もよろしくね！';
const voicevoxEndpoint = 'https://api.tts.quest/v3/voicevox/synthesis';

let playingAudio: HTMLAudioElement | null = null;
let recognitionInProgress = false;

async function speakWithDeviceTTS(): Promise<void> {
  const { voices } = await TextToSpeech.getSupportedVoices();
  const preferredVoice = voices.findIndex(
    voice => voice.voiceURI === 'ja-jp-x-htm-local'
  );

  await TextToSpeech.stop();
  await TextToSpeech.speak({
    text: greetingText,
    lang: 'ja-JP',
    rate: 1.08,
    pitch: 1.3,
    volume: 1.0,
    ...(preferredVoice >= 0 ? { voice: preferredVoice } : {})
  });
}

async function speakGreeting(): Promise<void> {
  playingAudio?.pause();

  try {
    const url = new URL(voicevoxEndpoint);
    url.searchParams.set('speaker', '0');
    url.searchParams.set('text', greetingText);

    const response = await fetch(url);
    const result = (await response.json()) as {
      success: boolean;
      mp3StreamingUrl?: string;
    };

    if (!result.success || !result.mp3StreamingUrl) {
      throw new Error('VOICEVOX synthesis failed');
    }

    await new Promise<void>((resolve, reject) => {
      const audio = new Audio(result.mp3StreamingUrl);
      playingAudio = audio;
      audio.onended = () => {
        playingAudio = null;
        resolve();
      };
      audio.onerror = () => reject(new Error('VOICEVOX playback failed'));
      void audio.play().catch(reject);
    });
  } catch {
    await speakWithDeviceTTS();
  }
}

export function initializeAppUI(): void {
  const loading = document.getElementById('loading');
  const button = document.getElementById('mic-button') as HTMLButtonElement;
  const ttsButton = document.getElementById('tts-button') as HTMLButtonElement;
  const status = document.getElementById('voice-status');

  const waitForModel = (): void => {
    const model = LAppLive2DManager.getInstance().getModel(0);
    if (!model?.isReady()) {
      requestAnimationFrame(waitForModel);
      return;
    }

    loading?.classList.add('hidden');
    button.disabled = false;
    ttsButton.disabled = false;
    if (status) {
      status.textContent = '말하기를 누르고 「こんにちは」라고 해보세요';
    }
  };

  const handleTtsClick = async (): Promise<void> => {
    ttsButton.disabled = true;
    try {
      await speakGreeting();
      if (status) {
        status.textContent = greetingText;
      }
    } catch {
      if (status) status.textContent = '기기의 한국어 TTS 설정을 확인해주세요';
    } finally {
      ttsButton.disabled = false;
    }
  };

  const handleMicClick = async (): Promise<void> => {
    if (recognitionInProgress) {
      return;
    }

    recognitionInProgress = true;
    button.disabled = true;
    button.textContent = '듣는 중...';
    if (status) status.textContent = '듣고 있어요';

    try {
      const available = await SpeechRecognition.available();
      if (!available.available) throw new Error('unavailable');

      const permission = await SpeechRecognition.requestPermissions();
      if (permission.speechRecognition !== 'granted') {
        throw new Error('permission');
      }

      await SpeechRecognition.removeAllListeners();
      const result = await SpeechRecognition.start({
        language: 'ja-JP',
        maxResults: 1,
        partialResults: false,
        popup: false
      });

      const text = result.matches?.[0]?.trim() ?? '';
      if (!text) {
        throw new Error('no-match');
      }

      if (greetings.some(pattern => pattern.test(text))) {
        LAppLive2DManager.getInstance().reactToGreeting();
        if (status) status.textContent = `「${text}」— こんにちは！`;
        await speakGreeting();
      } else if (status) {
        status.textContent = `「${text}」— 「こんにちは」と言ってみてね`;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (status) {
        status.textContent =
          message.includes("Didn't understand") || message === 'no-match'
            ? '잘 못 들었어요. 다시 말해 주세요'
            : '음성 인식을 시작하지 못했어요';
      }
    } finally {
      recognitionInProgress = false;
      button.disabled = false;
      button.textContent = '말하기';
    }
  };

  ttsButton.addEventListener('click', event => {
    event.stopPropagation();
    void handleTtsClick();
  });

  button.addEventListener('click', event => {
    event.stopPropagation();
    void handleMicClick();
  });

  waitForModel();
}
