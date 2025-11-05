'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export interface LoaderState {
  x: number;
  y: number;
  direction: 'up' | 'down' | 'left' | 'right';
  forkLifted: boolean;
}

interface LoaderContextType {
  loaderState: LoaderState;
  moveLoader: (direction: 'up' | 'down' | 'left' | 'right', steps?: number) => void;
  setForkLifted: (lifted: boolean) => void;
  setPosition: (x: number, y: number) => void;
  setDirection: (direction: 'up' | 'down' | 'left' | 'right') => void;
}

const LoaderContext = createContext<LoaderContextType | undefined>(undefined);

export function LoaderProvider({ children }: { children: ReactNode }) {
  const [loaderState, setLoaderState] = useState<LoaderState>({
    x: 10,
    y: 10,
    direction: 'right',
    forkLifted: false,
  });

  const moveLoader = (direction: 'up' | 'down' | 'left' | 'right', steps: number = 1) => {
    setLoaderState((prev) => {
      let newX = prev.x;
      let newY = prev.y;

      switch (direction) {
        case 'up':
          newY = Math.max(0, prev.y - steps);
          break;
        case 'down':
          newY = Math.min(99, prev.y + steps);
          break;
        case 'left':
          newX = Math.max(0, prev.x - steps);
          break;
        case 'right':
          newX = Math.min(99, prev.x + steps);
          break;
      }

      return { ...prev, x: newX, y: newY, direction };
    });
  };

  const setForkLifted = (lifted: boolean) => {
    setLoaderState((prev) => ({ ...prev, forkLifted: lifted }));
  };

  const setPosition = (x: number, y: number) => {
    setLoaderState((prev) => ({
      ...prev,
      x: Math.max(0, Math.min(99, x)),
      y: Math.max(0, Math.min(99, y)),
    }));
  };

  const setDirection = (direction: 'up' | 'down' | 'left' | 'right') => {
    setLoaderState((prev) => ({ ...prev, direction }));
  };

  return (
    <LoaderContext.Provider
      value={{
        loaderState,
        moveLoader,
        setForkLifted,
        setPosition,
        setDirection,
      }}
    >
      {children}
    </LoaderContext.Provider>
  );
}

export function useLoaderController() {
  const context = useContext(LoaderContext);
  if (context === undefined) {
    throw new Error('useLoaderController must be used within a LoaderProvider');
  }
  return context;
}
