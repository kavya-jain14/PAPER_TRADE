import React from 'react';
import styles from './PrimaryButton.module.css';

const PrimaryButton = ({
  children,
  onClick,
  type = 'button',
  state = 'idle', // 'idle' | 'loading' | 'success' | 'disabled'
  loadingLabel,
}) => {
  const isDisabled = state === 'loading' || state === 'success' || state === 'disabled';
  
  return (
    <button
      type={type}
      className={`${styles.button} ${state === 'success' ? styles.success : ''}`}
      onClick={onClick}
      disabled={isDisabled}
    >
      {state === 'loading' && <div className={styles.spinner} />}
      {state === 'loading' ? (loadingLabel || 'Loading...') : children}
    </button>
  );
};

export default PrimaryButton;
