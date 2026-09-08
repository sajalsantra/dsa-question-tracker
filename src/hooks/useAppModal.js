import { useState, useCallback, useRef } from 'react';

export function useAppModal() {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    subtitle: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    isDanger: false,
    showCancel: true,
  });

  const resolveRef = useRef(null);

  const showConfirm = useCallback(({
    title = 'Confirm',
    subtitle = '',
    message = 'Are you sure?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDanger = false,
  }) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setModalState({
        isOpen: true,
        title,
        subtitle,
        message,
        confirmText,
        cancelText,
        isDanger,
        showCancel: true,
      });
    });
  }, []);

  const showAlert = useCallback(({
    title = 'Alert',
    subtitle = '',
    message = '',
    confirmText = 'OK',
  }) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setModalState({
        isOpen: true,
        title,
        subtitle,
        message,
        confirmText,
        cancelText: '',
        isDanger: false,
        showCancel: false,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
    if (resolveRef.current) {
      resolveRef.current(true);
      resolveRef.current = null;
    }
  }, []);

  const handleCancel = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
    if (resolveRef.current) {
      resolveRef.current(false);
      resolveRef.current = null;
    }
  }, []);

  return {
    modalState,
    showConfirm,
    showAlert,
    handleConfirm,
    handleCancel,
  };
}
