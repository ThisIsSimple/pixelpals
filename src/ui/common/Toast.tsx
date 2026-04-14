import React from 'react';

interface ToastProps {
  message: string;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  return (
    <div className="fixed top-14 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
      <div className="font-pixel text-pixel-sm text-white bg-pixel-primary border-2 border-pixel-muted px-5 py-2.5 whitespace-nowrap animate-pop-in">
        {message}
      </div>
    </div>
  );
};
