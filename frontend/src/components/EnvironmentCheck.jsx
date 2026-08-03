import { useState, useEffect } from 'react';
import { Spinner } from './Spinner';

const CONFIRM_HOLD_MS = 3000;

/**
 * Pre-exam gate: requests camera access, loads the face detection model,
 * and requires a face to be visible continuously for a few seconds before
 * the student is allowed to proceed. Blocks entirely if camera access is
 * denied, per the chosen strictness policy.
 */
export default function EnvironmentCheck({ proctoring, onPassed }) {
  const { videoRef, cameraStatus, modelStatus, requestCamera, ensureModelsLoaded, detectFaces } = proctoring;
  const [faceHoldStartedAt, setFaceHoldStartedAt] = useState(null);
  const [holdProgress, setHoldProgress] = useState(0);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    (async () => {
      await Promise.all([requestCamera(), ensureModelsLoaded()]);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (cameraStatus !== 'ready' || modelStatus !== 'ready') return undefined;

    setChecking(true);
    const interval = setInterval(async () => {
      const faceCount = await detectFaces();

      if (faceCount === 1) {
        setFaceHoldStartedAt((prev) => prev ?? Date.now());
      } else {
        setFaceHoldStartedAt(null);
        setHoldProgress(0);
      }
    }, 400);

    return () => clearInterval(interval);
  }, [cameraStatus, modelStatus, detectFaces]);

  useEffect(() => {
    if (!faceHoldStartedAt) return undefined;

    const interval = setInterval(() => {
      const elapsed = Date.now() - faceHoldStartedAt;
      const progress = Math.min(100, (elapsed / CONFIRM_HOLD_MS) * 100);
      setHoldProgress(progress);

      if (elapsed >= CONFIRM_HOLD_MS) {
        clearInterval(interval);
        onPassed();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [faceHoldStartedAt, onPassed]);

  return (
    <div className="max-w-md mx-auto text-center animate-fade-slide-up">
      <h2 className="font-display text-2xl font-semibold text-paper">Environment check</h2>
      <p className="mt-2 text-sm text-paper/65">
        Before starting, we need to confirm your camera is working. This exam is monitored for
        academic integrity. No video is recorded or transmitted, only activity signals.
      </p>

      <div className="mt-6 relative w-64 h-48 mx-auto rounded-xl overflow-hidden border border-ink-border bg-ink-raised">
        <video ref={videoRef} muted playsInline className="w-full h-full object-cover -scale-x-100" />
        {cameraStatus !== 'ready' && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink-raised">
            {cameraStatus === 'requesting' && <Spinner size="lg" />}
            {cameraStatus === 'denied' && (
              <p className="text-xs text-clay px-4">Camera access was denied.</p>
            )}
            {cameraStatus === 'idle' && <Spinner size="lg" />}
          </div>
        )}
      </div>

      {cameraStatus === 'denied' && (
        <div className="mt-5 card !bg-clay/5 !border-clay/25 text-left">
          <p className="text-sm text-clay font-medium">Camera access is required</p>
          <p className="mt-1 text-xs text-paper/60">
            This is a live-proctored exam and cannot be started without camera access. Please
            enable camera permissions for this site in your browser settings, then refresh the
            page.
          </p>
        </div>
      )}

      {cameraStatus === 'ready' && modelStatus === 'loading' && (
        <p className="mt-4 text-xs text-muted flex items-center justify-center gap-2">
          <Spinner /> Loading face detection model…
        </p>
      )}

      {checking && modelStatus === 'ready' && (
        <div className="mt-5">
          <p className="text-xs text-muted mb-2">
            {faceHoldStartedAt ? 'Hold still, confirming…' : 'Please look at the camera'}
          </p>
          <div className="w-full h-1.5 rounded-full bg-ink-border overflow-hidden">
            <div
              className="h-full bg-moss-500 transition-all duration-100"
              style={{ width: `${holdProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
