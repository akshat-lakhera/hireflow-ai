// Audio & Speech Synthesis Service utilizing native browser Web Speech API
// Zero external server dependencies; works locally in Chrome, Edge, Safari

export class AudioService {
  private static recognition: any = null;
  private static isListening: boolean = false;

  public static isSpeechSupported(): boolean {
    return typeof window !== 'undefined' && 
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  }

  public static startListening(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (error: string) => void,
    onEnd: () => void
  ): boolean {
    if (!this.isSpeechSupported()) {
      onError('Speech Recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return false;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const currentText = finalTranscript || interimTranscript;
        onResult(currentText, Boolean(finalTranscript));
      };

      this.recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
          onError(`Speech error: ${event.error}`);
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        onEnd();
      };

      this.recognition.start();
      this.isListening = true;
      return true;
    } catch (e: any) {
      console.error('Failed to start speech recognition:', e);
      onError(e.message || 'Microphone activation failed');
      return false;
    }
  }

  public static stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  private static lockedVoice: SpeechSynthesisVoice | null = null;
  private static isVoiceInitialized: boolean = false;

  /**
   * Pre-loads and locks a single high-quality voice so the app never switches voices.
   */
  public static initVoice(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const selectBestVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) return;

      // Priority: Lock to one natural, high-fidelity English voice
      const preferred = voices.find(v => 
        (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Jenny') || v.name.includes('Samantha')) &&
        (v.lang === 'en-US' || v.lang === 'en-GB' || v.lang.startsWith('en'))
      ) || voices.find(v => v.lang === 'en-US') || voices.find(v => v.lang.startsWith('en')) || voices[0];

      if (preferred) {
        this.lockedVoice = preferred;
        this.isVoiceInitialized = true;
      }
    };

    selectBestVoice();
    if (!this.lockedVoice && window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = () => {
        selectBestVoice();
      };
    }
  }

  public static speak(text: string, onDone?: () => void): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onDone) onDone();
      return;
    }

    // Cancel any previous speech
    window.speechSynthesis.cancel();

    // Clean text for natural speech (remove excessive quotes or markup)
    const cleanText = text.replace(/["""]/g, '').trim();
    if (!cleanText) {
      if (onDone) onDone();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Ensure voice is initialized
    if (!this.lockedVoice) {
      this.initVoice();
    }

    if (this.lockedVoice) {
      utterance.voice = this.lockedVoice;
    }

    utterance.onend = () => {
      if (onDone) onDone();
    };

    utterance.onerror = (e) => {
      console.warn('TTS playback error:', e);
      if (onDone) onDone();
    };

    window.speechSynthesis.speak(utterance);
  }

  public static cancelSpeech(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

// Auto-initialize voice on load
if (typeof window !== 'undefined') {
  AudioService.initVoice();
}

