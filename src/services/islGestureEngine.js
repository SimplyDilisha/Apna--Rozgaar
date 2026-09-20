/**
 * ISL Gesture Engine (ported from Interview-Prep-Buddy-V2)
 * Uses MediaPipe Hands to classify Indian Sign Language (ISL) A-Z alphabet gestures.
 * Rule-based classifier with temporal smoothing (majority vote buffer).
 */

import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

// Finger tip / mid / base landmark indices (MediaPipe convention)
const FINGER_TIPS  = [4, 8, 12, 16, 20];
const FINGER_MIDS  = [3, 7, 11, 15, 19];
const FINGER_BASES = [2, 5,  9, 13, 17];
const WRIST = 0;

function isFingerExtended(landmarks, finger) {
  if (finger === 0) {
    // Thumb: compare tip x distance to palm center
    const palmCenterX = landmarks[9].x;
    return Math.abs(landmarks[FINGER_TIPS[0]].x - palmCenterX) > 0.08;
  }
  const tip  = landmarks[FINGER_TIPS[finger]];
  const base = landmarks[FINGER_BASES[finger]];
  return tip.y < base.y - 0.04;
}

function dist(a, b) {
  return Math.sqrt(
    Math.pow(a.x - b.x, 2) +
    Math.pow(a.y - b.y, 2) +
    Math.pow(a.z - b.z, 2)
  );
}

function classifyISLGesture(landmarks) {
  const thumb  = isFingerExtended(landmarks, 0);
  const index  = isFingerExtended(landmarks, 1);
  const middle = isFingerExtended(landmarks, 2);
  const ring   = isFingerExtended(landmarks, 3);
  const pinky  = isFingerExtended(landmarks, 4);

  const thumbTip   = landmarks[4];
  const indexTip   = landmarks[8];
  const middleTip  = landmarks[12];
  const ringTip    = landmarks[16];
  const pinkyTip   = landmarks[20];
  const wrist      = landmarks[WRIST];
  const indexBase  = landmarks[5];
  const pinkyBase  = landmarks[17];

  const thumbIndexDist  = dist(thumbTip, indexTip);
  const indexMiddleDist = dist(indexTip, middleTip);
  const handWidth       = dist(indexBase, pinkyBase) || 0.1;

  const normThumbIndex  = thumbIndexDist / handWidth;
  const normIndexMiddle = indexMiddleDist / handWidth;

  // ── ISL Classification Rules ──────────────────────────────────────────────
  // A: fist, thumb beside
  if (!index && !middle && !ring && !pinky && thumb)
    return { letter: 'A', confidence: 0.85 };

  // B: all 4 fingers up, thumb in
  if (!thumb && index && middle && ring && pinky)
    return { letter: 'B', confidence: 0.85 };

  // C: curved C-shape (all curled, gap between thumb and index)
  if (!thumb && !index && !middle && !ring && !pinky) {
    const curvature = Math.abs(indexTip.x - thumbTip.x);
    if (curvature > 0.08 && curvature < 0.2)
      return { letter: 'C', confidence: 0.75 };
  }

  // D: index only up
  if (index && !middle && !ring && !pinky && !thumb)
    return { letter: 'D', confidence: 0.82 };

  // F: index+thumb touching, others extended
  if (!index && middle && ring && pinky && !thumb && normThumbIndex < 0.3)
    return { letter: 'F', confidence: 0.80 };

  // G: index sideways + thumb
  if (index && !middle && !ring && !pinky && thumb) {
    const isHoriz = Math.abs(indexTip.x - indexBase.x) > Math.abs(indexTip.y - indexBase.y);
    if (isHoriz) return { letter: 'G', confidence: 0.78 };
  }

  // H: index+middle horizontal
  if (index && middle && !ring && !pinky && !thumb) {
    if (Math.abs(indexTip.x - indexBase.x) > 0.05)
      return { letter: 'H', confidence: 0.76 };
  }

  // I: pinky only
  if (!thumb && !index && !middle && !ring && pinky) {
    if (pinkyTip.x >= pinkyBase.x - 0.05)
      return { letter: 'I', confidence: 0.88 };
    return { letter: 'J', confidence: 0.70 };
  }

  // K: thumb+index+middle
  if (thumb && index && middle && !ring && !pinky)
    return { letter: 'K', confidence: 0.80 };

  // L: index+thumb L-shape
  if (thumb && index && !middle && !ring && !pinky)
    return { letter: 'L', confidence: 0.88 };

  // O: thumb touching index, all curled
  if (!thumb && !index && !middle && !ring && !pinky && normThumbIndex < 0.35)
    return { letter: 'O', confidence: 0.75 };

  // P: index pointing down + thumb
  if (index && !middle && !ring && !pinky && thumb && indexTip.y > indexBase.y + 0.05)
    return { letter: 'P', confidence: 0.75 };

  // R: index+middle together
  if (!thumb && index && middle && !ring && !pinky && normIndexMiddle < 0.25)
    return { letter: 'R', confidence: 0.78 };

  // U: index+middle spread
  if (!thumb && index && middle && !ring && !pinky && normIndexMiddle >= 0.25)
    return { letter: 'V', confidence: 0.85 };

  // W: index+middle+ring
  if (!thumb && index && middle && ring && !pinky)
    return { letter: 'W', confidence: 0.85 };

  // X: index hooked
  if (!thumb && !middle && !ring && !pinky && indexTip.y > landmarks[7].y)
    return { letter: 'X', confidence: 0.72 };

  // Y: thumb+pinky (shaka)
  if (thumb && !index && !middle && !ring && pinky)
    return { letter: 'Y', confidence: 0.90 };

  // Z: index extended (static version)
  if (!thumb && index && !middle && !ring && !pinky)
    return { letter: 'Z', confidence: 0.78 };

  // All curled fist fallback → S
  if (!thumb && !index && !middle && !ring && !pinky)
    return { letter: 'S', confidence: 0.65 };

  return { letter: '?', confidence: 0.30 };
}

// ── Main Engine ───────────────────────────────────────────────────────────────

class ISLGestureEngine {
  constructor() {
    this.handLandmarker = null;
    this.initialized    = false;
    this.initializing   = false;
    this.gestureBuffer  = [];
    this.BUFFER_SIZE    = 8;
    this.CONFIDENCE_THRESHOLD = 0.45;
  }


  async initialize() {
    if (this.initialized || this.initializing) return;
    this.initializing = true;

    // 6-second timeout so it never hangs forever
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('ISL engine load timed out')), 6000)
    );

    try {
      await Promise.race([
        (async () => {
          const vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
          );
          this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
              delegate: 'GPU',
            },
            runningMode: 'VIDEO',
            numHands: 2,
            minHandDetectionConfidence: 0.5,
            minHandPresenceConfidence:  0.5,
            minTrackingConfidence:      0.5,
          });
        })(),
        timeout,
      ]);
      this.initialized = true;
      console.log('[ISLGestureEngine] Initialized with 2-hand tracking.');
    } catch (err) {
      console.warn('[ISLGestureEngine] Failed to load:', err.message);
      this.initialized = false;
    } finally {
      this.initializing = false;
    }
  }

  processFrame(video, timestamp) {
    if (!this.initialized || !this.handLandmarker) {
      return { letter: null, confidence: 0, handDetected: false, landmarks: [] };
    }
    if (!video || video.readyState < 2) {
      return { letter: null, confidence: 0, handDetected: false, landmarks: [] };
    }

    let result;
    try {
      result = this.handLandmarker.detectForVideo(video, timestamp);
    } catch {
      return { letter: null, confidence: 0, handDetected: false, landmarks: [] };
    }

    if (!result.landmarks || result.landmarks.length === 0) {
      this.gestureBuffer = [];
      return { letter: null, confidence: 0, handDetected: false, landmarks: [] };
    }

    // Process all detected hands (up to 2 hands simultaneously)
    let bestLetter = null;
    let bestConfidence = 0;
    const allHandsLandmarks = [];

    for (let h = 0; h < result.landmarks.length; h++) {
      const landmarks = result.landmarks[h];
      const { letter, confidence } = classifyISLGesture(landmarks);
      allHandsLandmarks.push(landmarks.map(lm => [lm.x, lm.y, lm.z]));

      if (letter && letter !== '?' && confidence > bestConfidence) {
        bestLetter = letter;
        bestConfidence = confidence;
      }
    }

    // Temporal smoothing
    if (bestLetter && bestConfidence >= this.CONFIDENCE_THRESHOLD) {
      this.gestureBuffer.push(bestLetter);
      if (this.gestureBuffer.length > this.BUFFER_SIZE) this.gestureBuffer.shift();
    } else {
      this.gestureBuffer = [];
    }

    const stableLetter = this._majorityVote();

    return {
      letter:      stableLetter,
      confidence:  stableLetter ? bestConfidence : 0,
      handDetected: true,
      landmarks:   allHandsLandmarks,
    };
  }


  _majorityVote() {
    if (this.gestureBuffer.length < 3) return null;
    const counts = {};
    for (const g of this.gestureBuffer) counts[g] = (counts[g] || 0) + 1;
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const [topLetter, topCount] = sorted[0];
    return topCount / this.gestureBuffer.length >= 0.4 ? topLetter : null;
  }


  destroy() {
    this.handLandmarker?.close?.();
    this.handLandmarker = null;
    this.initialized    = false;
  }
}

export const islGestureEngine = new ISLGestureEngine();
export default islGestureEngine;
