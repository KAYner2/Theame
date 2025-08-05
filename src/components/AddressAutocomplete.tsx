import { useState, useRef, useEffect } from 'react';
import { Input } from './ui/input';
import { useAddressAutocomplete } from '../hooks/useAddressAutocomplete';
import { cn } from '@/lib/utils';

interface AddressAutocompleteProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
}

export const AddressAutocomplete = ({ 
  value = '', 
  onChange, 
  placeholder = "Введите улицу и номер дома",
  className,
  error 
}: AddressAutocompleteProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { query, setQuery, suggestions, isOpen, setIsOpen, selectAddress } = useAddressAutocomplete();

  // Синхронизируем внутреннее состояние с внешним значением
  useEffect(() => {
    if (value !== query) {
      setQuery(value);
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    onChange(newValue);
  };

  const handleSuggestionClick = (address: string) => {
    selectAddress(address);
    onChange(address);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setIsOpen(true);
    }
  };

  // Закрываем список при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [setIsOpen]);

  return (
    <div ref={containerRef} className="relative">
      <Input
        ref={inputRef}
        value={query}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        placeholder={placeholder}
        className={cn(className, error && "border-red-500")}
      />
      
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-input rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((address, index) => (
            <div
              key={index}
              className="px-3 py-2 cursor-pointer hover:bg-muted text-sm transition-colors"
              onClick={() => handleSuggestionClick(address)}
            >
              {address}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};