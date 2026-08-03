import { useState, useEffect, useRef, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { getSocket } from '../services/socket';

const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js/weights';
const DETECTION_INTERVAL_MS = 2000;
// A face must be missing for this long, continuously, before it counts as a violation.
const FACE_MISSING_GRACE_MS = 3000;

let modelsLoadedPromise = null;

function loadModels() {
  if (!modelsLoadedPromise) {
    modelsLoadedPromise = faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
  }
  return modelsLoadedPromise;
}

/**
 * Manages the full proctoring lifecycle for a live exam session:
 *  - loads face-api.js's tiny face detector model
 *  - requests camera access and runs a periodic detection loop
 *  - listens for tab-switch, window-blur, and copy/paste events
 *  - emits violation events over the shared exam socket room
 *  - tracks integrity score and exposes warning/critical alert state
 *
 * Video frames are read locally by the model and never leave the browser;
 * only lightweight event labels (e.g. "face_missing") are sent to the server.
 */
export function useProctoring({ assessmentId, examSessionId, active }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectionTimerRef = useRef(null);
  const faceMissingSinceRef = useRef(null);
  const criticalAlertShownRef = useRef(false);

  const [cameraStatus, setCameraStatus] = useState('idle'); // idle | requesting | ready | denied | error
  const [modelStatus, setModelStatus] = useState('idle'); // idle | loading | ready | error
  const [integrityScore, setIntegrityScore] = useState(100);
  const [warning, setWarning] = useState(null); // { type, message } - transient soft-violation notice
  const [showCriticalAlert, setShowCriticalAlert] = useState(false);
  const [violationLog, setViolationLog] = useState([]);

  const emitViolation = useCallback((type) => {
    const socket = getSocket();
    socket.emit('violation', { type }, (response) => {
      if (!response || response.error) return;

      setIntegrityScore(response.integrityScore);
      setViolationLog((log) => [...log, { type, timestamp: new Date(), isNewWarning: response.isNewWarning }]);

      if (response.isNewWarning) {
        setWarning({ type, message: warningMessageFor(type) });
        setTimeout(() => setWarning(null), 5000);
      }

      if (response.integrityScore <= 15 && !criticalAlertShownRef.current) {
        criticalAlertShownRef.current = true;
        setShowCriticalAlert(true);
      }
    });
  }, []);

  // --- Camera + model setup (used both for the pre-exam check and the live loop) ---
  const requestCamera = useCallback(async () => {
    setCameraStatus('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraStatus('ready');
      return true;
    } catch (err) {
      setCameraStatus('denied');
      return false;
    }
  }, []);

  const ensureModelsLoaded = useCallback(async () => {
    setModelStatus('loading');
    try {
      await loadModels();
      setModelStatus('ready');
      return true;
    } catch (err) {
      setModelStatus('error');
      return false;
    }
  }, []);

  /**
   * Runs a single detection pass. Returns the number of faces found, or null
   * if the video isn't ready yet.
   */
  const detectFaces = useCallback(async () => {
    if (!videoRef.current || videoRef.current.readyState < 2) return null;
    const detections = await faceapi.detectAllFaces(
      videoRef.current,
      new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
    );
    return detections.length;
  }, []);

  // --- Live detection loop, only runs while `active` is true ---
  useEffect(() => {
    if (!active || cameraStatus !== 'ready' || modelStatus !== 'ready') return undefined;

    detectionTimerRef.current = setInterval(async () => {
      const faceCount = await detectFaces();
      if (faceCount === null) return;

      if (faceCount === 0) {
        if (!faceMissingSinceRef.current) {
          faceMissingSinceRef.current = Date.now();
        } else if (Date.now() - faceMissingSinceRef.current >= FACE_MISSING_GRACE_MS) {
          emitViolation('face_missing');
          faceMissingSinceRef.current = Date.now(); // reset so it doesn't fire every tick
        }
      } else {
        faceMissingSinceRef.current = null;
      }

      if (faceCount > 1) {
        emitViolation('multiple_faces');
      }
    }, DETECTION_INTERVAL_MS);

    return () => clearInterval(detectionTimerRef.current);
  }, [active, cameraStatus, modelStatus, detectFaces, emitViolation]);

  // --- Tab switch / window blur / copy-paste listeners ---
  useEffect(() => {
    if (!active) return undefined;

    function handleVisibilityChange() {
      if (document.hidden) emitViolation('tab_switch');
    }
    function handleBlur() {
      emitViolation('window_blur');
    }
    function handleCopyPaste(e) {
      e.preventDefault();
      emitViolation('copy_paste');
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);
    document.addEventListener('cut', handleCopyPaste);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
      document.removeEventListener('cut', handleCopyPaste);
    };
  }, [active, emitViolation]);

  // --- Cleanup camera stream on unmount ---
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const dismissCriticalAlert = useCallback(() => setShowCriticalAlert(false), []);

  return {
    videoRef,
    cameraStatus,
    modelStatus,
    integrityScore,
    warning,
    showCriticalAlert,
    dismissCriticalAlert,
    violationLog,
    requestCamera,
    ensureModelsLoaded,
    detectFaces,
  };
}

function warningMessageFor(type) {
  switch (type) {
    case 'tab_switch':
      return 'Please stay on the exam tab. Switching tabs is being monitored.';
    case 'window_blur':
      return 'Please keep the exam window focused.';
    case 'face_missing':
      return 'Please stay visible in frame.';
    default:
      return 'This action is being monitored.';
  }
}
