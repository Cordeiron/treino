import { useEffect, useRef, useState } from 'react';
import { F1CarScene, F1SceneConfig } from '../three/F1CarScene';

interface F1CanvasProps {
  config: F1SceneConfig;
  className?: string;
}

export function F1Canvas({ config, className = '' }: F1CanvasProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<F1CarScene | null>(null);
  const initialConfigRef = useRef<F1SceneConfig>(config);
  const [contextLost, setContextLost] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let instance: F1CarScene | null = null;
    try {
      instance = new F1CarScene(container, initialConfigRef.current);
      sceneRef.current = instance;
    } catch {
      setContextLost(true);
      return;
    }

    const canvas = container.querySelector('canvas');
    const onLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const onRestored = () => {
      setContextLost(false);
    };

    canvas?.addEventListener('webglcontextlost', onLost);
    canvas?.addEventListener('webglcontextrestored', onRestored);

    return () => {
      canvas?.removeEventListener('webglcontextlost', onLost);
      canvas?.removeEventListener('webglcontextrestored', onRestored);
      instance?.dispose();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    sceneRef.current?.updateConfig(config);
  }, [config]);

  return (
    <div className={`relative w-full h-full overflow-hidden bg-[#080B0E] ${className}`}>
      <div ref={mountRef} className="w-full h-full" />
      {contextLost && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#080B0E] text-center p-8">
          <p className="font-display text-2xl font-bold tracking-wider text-[#00D2BE]">
            RR-01 SILVER ARROW
          </p>
          <p className="mt-2 text-sm text-[#C5CBD0] max-w-md">
            Visualização 3D em pausa para economia de recursos gráficos. Toda a telemetria e treinos continuam ativos.
          </p>
        </div>
      )}
    </div>
  );
}
