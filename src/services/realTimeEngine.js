// Real-Time Engine (Dual Mode: BroadcastChannel + Firebase Firestore Sync)

class RealTimeEngine {
  constructor() {
    this.channel = null;
    this.listeners = new Map(); // event -> Set of callbacks
    this.audioContext = null;
    this.initBroadcastChannel();
  }

  initBroadcastChannel() {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.channel = new BroadcastChannel('mychat_realtime_bus');
        this.channel.onmessage = (event) => {
          const { type, data, senderTabId } = event.data || {};
          this.emit(type, data);
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel not supported or restricted in iframe:', e);
    }
  }

  // Subscribe to real-time events
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    // Return unsubscriber function
    return () => {
      const set = this.listeners.get(event);
      if (set) {
        set.delete(callback);
      }
    };
  }

  // Emit event locally and broadcast to other tabs/windows
  broadcast(type, data) {
    // Local emit
    this.emit(type, data);

    // Tab broadcast
    if (this.channel) {
      try {
        this.channel.postMessage({
          type,
          data,
          timestamp: Date.now()
        });
      } catch (err) {
        console.warn('Failed to broadcast realtime message:', err);
      }
    }
  }

  emit(type, data) {
    const callbacks = this.listeners.get(type);
    if (callbacks) {
      callbacks.forEach(cb => {
        try { cb(data); } catch (e) { console.error(`Error in event listener for ${type}:`, e); }
      });
    }
  }

  // Play subtle pop audio notification on incoming message
  playNotificationSound() {
    try {
      if (!this.audioContext) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) this.audioContext = new AudioContext();
      }
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      if (this.audioContext) {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, this.audioContext.currentTime); // D5 note
        osc.frequency.exponentialRampToValueAtTime(880, this.audioContext.currentTime + 0.1); // A5 note

        gain.gain.setValueAtTime(0.08, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.15);
      }
    } catch (e) {
      // Audio playback blocked or unallowed
    }
  }
}

export const realTimeEngine = new RealTimeEngine();
