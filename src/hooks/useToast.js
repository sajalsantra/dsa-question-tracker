import { useState, useCallback, useRef } from 'react';

export function useToast() {
  const [message, setMessage] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef(null);

  const showToast = useCallback((msg) => {
    setMessage(msg);
    setIsVisible(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 2200);
  }, []);

  return { message, isVisible, showToast };
}
