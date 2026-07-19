import React, { useState, useEffect } from 'react';
import styles from './TextField.module.css';

const TextField = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  capsLockAware = false,
  required = false,
  disabled = false,
}) => {
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!capsLockAware) return;

    const handleKeyDown = (e) => {
      if (e.getModifierState) {
        setCapsLockActive(e.getModifierState('CapsLock'));
      }
    };

    const handleKeyUp = (e) => {
      if (e.getModifierState) {
        setCapsLockActive(e.getModifierState('CapsLock'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [capsLockAware]);

  return (
    <div className={styles.container}>
      <label className={styles.label} htmlFor={name}>
        {label}
      </label>
      <div className={styles.inputWrapper}>
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={(e) => {
            setIsFocused(false);
            if (onBlur) onBlur(e);
          }}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`${styles.input} ${error ? styles.error : ''} ${type === 'password' ? styles.inputPassword : ''}`}
        />
        {capsLockAware && isFocused && capsLockActive && (
          <span className={styles.capsLockHint}>Caps Lock</span>
        )}
      </div>
      {error && <div className={styles.errorText}>{error}</div>}
    </div>
  );
};

export default TextField;
