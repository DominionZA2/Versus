'use client'

import { useEffect, useRef, useState } from 'react';

type AiPhase = 'idle' | 'building' | 'request' | 'parsing' | 'done' | 'error';

interface AiStatusEventDetail {
  phase: AiPhase;
  message?: string;
  provider?: string;
}

export default function AIStatusOverlay() {
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<AiPhase>('idle');
  const [message, setMessage] = useState<string>('');
  const [provider, setProvider] = useState<string>('');
  const startAtRef = useRef<number | null>(null);
  const [, forceTick] = useState(0);

  useEffect(() => {
    const onStatus = (e: Event) => {
      const detail = (e as CustomEvent<AiStatusEventDetail>).detail || { phase: 'idle' };
      setPhase(detail.phase);
      setMessage(detail.message || '');
      setProvider(detail.provider || '');

      if (detail.phase === 'building' || detail.phase === 'request' || detail.phase === 'parsing') {
        setVisible(true);
        if (!startAtRef.current) startAtRef.current = Date.now();
      } else if (detail.phase === 'done') {
        // Show success briefly
        setVisible(true);
        setTimeout(() => {
          setVisible(false);
          startAtRef.current = null;
          setMessage('');
        }, 800);
      } else if (detail.phase === 'error') {
        setVisible(true);
      } else {
        setVisible(false);
        startAtRef.current = null;
      }
    };

    window.addEventListener('ai:status', onStatus as EventListener);

    const timer = setInterval(() => forceTick((v) => v + 1), 250);
    return () => {
      window.removeEventListener('ai:status', onStatus as EventListener);
      clearInterval(timer);
    };
  }, []);

  if (!visible) return null;

  const elapsed = startAtRef.current ? Math.max(0, Date.now() - startAtRef.current) : 0;
  const seconds = (elapsed / 1000).toFixed(1);

  const phaseText: Record<AiPhase, string> = {
    idle: 'Idle',
    building: 'Preparing prompt',
    request: 'Contacting AI',
    parsing: 'Processing response',
    done: 'Completed',
    error: 'Error',
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-gray-800/95 border border-gray-700 rounded-md shadow-lg p-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          <div className={`w-4 h-4 border-2 rounded-full ${phase === 'error' ? 'border-red-500 border-t-red-300' : 'border-blue-500/30 border-t-blue-500'} animate-spin`}></div>
        </div>
        <div className="flex-1">
          <div className="text-sm text-gray-200">
            {provider ? `${provider} · ` : ''}{phaseText[phase]}
          </div>
          {message && <div className="text-xs text-gray-400 mt-0.5">{message}</div>}
          <div className="text-[11px] text-gray-500 mt-1">Elapsed: {seconds}s</div>
        </div>
      </div>
    </div>
  );
}


