import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import styles from './GhostButton.module.css';

export default function GhostButton({ onSuccess, onError, disabled = false }) {
  if (disabled) return <div className={`${styles.googleWrap} ${styles.disabled}`} aria-hidden="true" />;
  return (
    <div className={styles.googleWrap}>
      <GoogleLogin
        onSuccess={onSuccess}
        onError={onError}
        type="standard"
        theme="filled_black"
        size="large"
        shape="rectangular"
        text="continue_with"
        logo_alignment="left"
        width="400"
        useOneTap={false}
      />
    </div>
  );
}
