import React, { useState } from 'react';
import { Input } from './ui/input';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  id?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  placeholder = "+7 (999) 123-45-67",
  className = "",
  required = false,
  id
}) => {
  const formatPhoneNumber = (val: string): string => {
    const digits = val.replace(/\D/g, '');
    
    if (!digits) return '';
    
    // Если начинается с 8, заменяем на 7
    let normalizedDigits = digits.startsWith('8') ? '7' + digits.slice(1) : digits;
    
    // Если не начинается с 7, добавляем 7
    if (!normalizedDigits.startsWith('7')) {
      normalizedDigits = '7' + normalizedDigits;
    }
    
    // Ограничиваем до 11 цифр
    const limitedDigits = normalizedDigits.slice(0, 11);
    
    // Форматируем
    if (limitedDigits.length === 1) {
      return '+7';
    } else if (limitedDigits.length <= 4) {
      return `+7 (${limitedDigits.slice(1)})`;
    } else if (limitedDigits.length <= 7) {
      return `+7 (${limitedDigits.slice(1, 4)}) ${limitedDigits.slice(4)}`;
    } else if (limitedDigits.length <= 9) {
      return `+7 (${limitedDigits.slice(1, 4)}) ${limitedDigits.slice(4, 7)}-${limitedDigits.slice(7)}`;
    } else {
      return `+7 (${limitedDigits.slice(1, 4)}) ${limitedDigits.slice(4, 7)}-${limitedDigits.slice(7, 9)}-${limitedDigits.slice(9)}`;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Если пользователь очистил поле полностью или оставил только "+7"
    if (!newValue || newValue === '+7') {
      onChange('');
      return;
    }
    
    const formatted = formatPhoneNumber(newValue);
    onChange(formatted);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // При Backspace, если остался только "+7", очищаем поле
    if (e.key === 'Backspace' && (value === '+7' || value === '+7 (')) {
      e.preventDefault();
      onChange('');
    }
  };

  return (
    <Input
      id={id}
      type="tel"
      inputMode="tel"
      placeholder={placeholder}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      className={className}
      required={required}
      autoComplete="tel"
    />
  );
};