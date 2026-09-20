import { FaceLandmarker, PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

/**
 * @typedef {Object} ConfidenceMetrics
 * @property {number} total       - overall confidence, 0-100 (what the UI badge/meter uses)
 * @property {number} eyeContact  - 0-100
 * @property {number} posture     - 0-100
 * @property {number} stability   - 0-100
 * @property {"Confident"|"Neutral"|"Low"} label
 */

const PREDICT_INTERVAL_MS = 500;
const BACKEND_URL = 'http://localhost:8000/predict';
const FETCH_TIMEOUT_MS = 3000;
const MAX_CONSECUTIVE_FAILURES = 5;

// How many recent shoulder-center positions to keep for jitter/stability calc.
const STABILITY_WINDOW = 15;

const POSE = {
  NOSE: 0,
  LEFT_EYE: 2,
  RIGHT_EYE: 5,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
};

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function midpoint(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

class ConfidenceEngine {
  constructor() {
    this.faceLandmarker = null;
    this.poseLandmarker = null;
    this.initialized = false;
    this.initializing = false;

    this.isSimulated = false;

    this.lastPredictTime = 0;
    this.lastResult = { total: 60, eyeContact: 60, posture: 60, stability: 60, label: 'Neutral' };
    this.pending = false;
    this.consecutiveFailures = 0;

    this.recentPositions = [];
    this.backendScore = null;
  }

  async initialize() {
    if (this.initialized || this.initializing) return;
    this.initializing = true;

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('MediaPipe model loading timed out')), 5000)
    );

    const loadPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
      );

      this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
        },
        runningMode: 'VIDEO',
        numFaces: 1,
      });

      this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
      });
    })();

    try {
      await Promise.race([loadPromise, timeoutPromise]);
      this.initialized = true;
      this.isSimulated = false;
      console.log('[ConfidenceEngine] Loaded MediaPipe successfully.');
    } catch (error) {
      console.warn('[ConfidenceEngine] MediaPipe failed to load, falling back to simulated mode:', error.message);
      this.isSimulated = true;
      this.initialized = true;
    } finally {
      this.initializing = false;
    }
  }

  buildFeatures(poseLandmarks) {
    const nose = poseLandmarks[POSE.NOSE];
    const leftEye = poseLandmarks[POSE.LEFT_EYE];
    const rightEye = poseLandmarks[POSE.RIGHT_EYE];
    const leftShoulder = poseLandmarks[POSE.LEFT_SHOULDER];
    const rightShoulder = poseLandmarks[POSE.RIGHT_SHOULDER];
    const leftWrist = poseLandmarks[POSE.LEFT_WRIST];
    const rightWrist = poseLandmarks[POSE.RIGHT_WRIST];
    const leftHip = poseLandmarks[POSE.LEFT_HIP];
    const rightHip = poseLandmarks[POSE.RIGHT_HIP];

    const eyeCenter = midpoint(leftEye, rightEye);
    const shoulderCenter = midpoint(leftShoulder, rightShoulder);
    const hipCenter = midpoint(leftHip, rightHip);

    const shoulderSpan = dist(leftShoulder, rightShoulder);
    const eyeDistance = dist(leftEye, rightEye);
    const wristDistanceX = Math.abs(leftWrist.x - rightWrist.x);

    const shoulderYDiff = leftShoulder.y - rightShoulder.y;
    const bodyLeanX = shoulderCenter.x - hipCenter.x;

    const eyeShoulderYRatio = (eyeCenter.y - shoulderCenter.y) / shoulderSpan;
    const eyeDistanceRatio = eyeDistance / shoulderSpan;
    const wristShoulderRatio = wristDistanceX / shoulderSpan;

    const hipShoulderYDiff = shoulderCenter.y / hipCenter.y;

    const noseEyeCenterOffsetX = nose.x - eyeCenter.x;

    const dx = Math.abs(hipCenter.x - shoulderCenter.x);
    const dy = Math.abs(hipCenter.y - shoulderCenter.y);
    const spineAngle = Math.atan2(dy, dx) * (180 / Math.PI);

    const headTiltAngle =
      Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * (180 / Math.PI);

    const headDirection = this.classifyHeadDirection(nose, eyeCenter, shoulderCenter);
    const armPosition = this.classifyArmPosition(wristShoulderRatio);
    const posture = this.classifyPosture(spineAngle, bodyLeanX);

    return {
      features: {
        eye_shoulder_y_ratio: eyeShoulderYRatio,
        shoulder_y_diff: shoulderYDiff,
        wrist_distance_x: wristDistanceX,
        wrist_shoulder_ratio: wristShoulderRatio,
        nose_eye_center_offset_x: noseEyeCenterOffsetX,
        shoulder_span: shoulderSpan,
        hip_shoulder_y_diff: hipShoulderYDiff,
        body_lean_x: bodyLeanX,
        shoulder_center_x: shoulderCenter.x,
        hip_center_x: hipCenter.x,
        spine_angle: spineAngle,
        eye_distance: eyeDistance,
        head_tilt_angle: headTiltAngle,
        eye_distance_ratio: eyeDistanceRatio,
        shoulder_slope: shoulderYDiff,
        head_direction: headDirection,
        arm_position: armPosition,
        posture: posture,
      },
      raw: { headDirection, posture, headTiltAngle, shoulderCenter },
    };
  }

  classifyHeadDirection(nose, eyeCenter, shoulderCenter) {
    const offset = (nose.x - eyeCenter.x) / (shoulderCenter.x || 1);
    if (offset > 0.03) return 'Looking Left';
    if (offset < -0.03) return 'Looking Right';
    return 'Looking Straight';
  }

  classifyArmPosition(wristShoulderRatio) {
    if (wristShoulderRatio < 0.9) return 'Closed';
    if (wristShoulderRatio < 1.5) return 'Partially Open';
    return 'Open';
  }

  classifyPosture(spineAngle, bodyLeanX) {
    if (spineAngle < 80) return 'Slouching';
    if (Math.abs(bodyLeanX) > 0.05) return 'Leaning';
    return 'Upright';
  }

  scoreEyeContact(raw) {
    let score = raw.headDirection === 'Looking Straight' ? 90 : 55;
    score -= clamp(Math.abs(raw.headTiltAngle), 0, 20) * 1.5;
    return Math.round(clamp(score, 0, 100));
  }

  scorePosture(raw) {
    if (raw.posture === 'Upright') return 90;
    if (raw.posture === 'Leaning') return 60;
    return 35;
  }

  scoreStability(shoulderCenter) {
    this.recentPositions.push(shoulderCenter);
    if (this.recentPositions.length > STABILITY_WINDOW) {
      this.recentPositions.shift();
    }
    if (this.recentPositions.length < 2) return 70;

    let totalMovement = 0;
    for (let i = 1; i < this.recentPositions.length; i++) {
      totalMovement += dist(this.recentPositions[i], this.recentPositions[i - 1]);
    }
    const avgMovement = totalMovement / (this.recentPositions.length - 1);
    const score = 100 - clamp(avgMovement * 800, 0, 70);
    return Math.round(clamp(score, 0, 100));
  }

  combineMetrics(eyeContact, posture, stability) {
    const visualAvg = (eyeContact + posture + stability) / 3;
    let total;
    if (this.backendScore != null) {
      total = Math.round(0.6 * (this.backendScore * 100) + 0.4 * visualAvg);
    } else {
      total = Math.round(visualAvg);
    }
    const label = total >= 75 ? 'Confident' : total >= 45 ? 'Neutral' : 'Low';
    return { total, eyeContact, posture, stability, label };
  }

  async requestPrediction(features) {
    if (this.pending) return;
    this.pending = true;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const res = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(features),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`Backend responded with ${res.status}`);

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      this.backendScore = typeof data.confidence === 'number' ? data.confidence : null;
      this.consecutiveFailures = 0;
      this.isSimulated = false;
    } catch (err) {
      console.warn('[ConfidenceEngine] prediction request failed:', err.message);
      this.consecutiveFailures += 1;
      if (this.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        console.warn('[ConfidenceEngine] backend unreachable repeatedly, switching to simulated mode.');
        this.isSimulated = true;
      }
    } finally {
      clearTimeout(timeoutId);
      this.pending = false;
    }
  }

  processFrame(video, timestamp) {
    if (!this.initialized) return this.lastResult;
    if (!video || video.readyState < 2) return this.lastResult;

    if (this.isSimulated) {
      return this.simulateResult(timestamp);
    }

    if (!this.poseLandmarker) return this.lastResult;

    try {
      const poseResults = this.poseLandmarker.detectForVideo(video, timestamp);
      const landmarks = poseResults.landmarks?.[0];
      if (!landmarks) return this.lastResult;

      const { features, raw } = this.buildFeatures(landmarks);

      const eyeContact = this.scoreEyeContact(raw);
      const posture = this.scorePosture(raw);
      const stability = this.scoreStability(raw.shoulderCenter);

      this.lastResult = this.combineMetrics(eyeContact, posture, stability);

      if (timestamp - this.lastPredictTime >= PREDICT_INTERVAL_MS) {
        this.lastPredictTime = timestamp;
        this.requestPrediction(features);
      }

      return this.lastResult;
    } catch (err) {
      console.warn('[ConfidenceEngine] processFrame error:', err.message);
      return this.lastResult;
    }
  }

  simulateResult(timestamp) {
    const sec = timestamp / 1000;
    const wobble = Math.sin(sec * 0.5) * 15;
    const total = Math.round(clamp(70 + wobble, 30, 95));
    const eyeContact = Math.round(clamp(total + Math.sin(sec * 0.7) * 10, 0, 100));
    const posture = Math.round(clamp(total + Math.cos(sec * 0.4) * 10, 0, 100));
    const stability = Math.round(clamp(total + Math.sin(sec * 0.9) * 8, 0, 100));
    const label = total >= 75 ? 'Confident' : total >= 45 ? 'Neutral' : 'Low';
    return { total, eyeContact, posture, stability, label };
  }
}

export const confidenceEngine = new ConfidenceEngine();
export default confidenceEngine;