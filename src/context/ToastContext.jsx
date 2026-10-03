import { createContext, useCallback, useContext, useRef, useState } from 'react';

const ToastCtx = createContext(() => {});

export function ToastProvider({ children }) {
  const [msg, setMsg] = useState('');
  const [show, setShow] = useState(false);
  const timer = useRef();

  const toast = useCallback((text, ms = 3200) => {
    setMsg(text);
    setShow(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setShow(false), ms);
  }, []);

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div id="toast" role="status" aria-live="polite"
        style={show ? { opacity: 1, transform: 'translateX(-50%) translateY(0)' } : undefined}>
        {msg}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
