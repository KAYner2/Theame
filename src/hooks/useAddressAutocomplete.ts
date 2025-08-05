import { useState, useEffect } from 'react';

// Список популярных улиц Сочи
const SOCHI_STREETS = [
  "Навагинская улица",
  "Курортный проспект",
  "Несебрская улица",
  "Пластунская улица", 
  "Театральная улица",
  "Орджоникидзе улица",
  "Роз улица",
  "Советская улица",
  "Горького улица",
  "Конституции СССР улица",
  "Донская улица",
  "Войкова улица",
  "Ленина улица",
  "Гагарина улица",
  "Красноармейская улица",
  "Московская улица",
  "Чернышевского улица",
  "Цветной бульвар",
  "Виноградная улица",
  "Черноморская улица",
  "Абрикосовая улица",
  "Альпийская улица",
  "Бытха улица",
  "Виноградники улица",
  "Волжская улица",
  "Выборгская улица",
  "Дагомысская улица",
  "Депутатская улица",
  "Единство улица",
  "Загородная улица",
  "Звездная улица",
  "Калинина улица",
  "Кирова улица",
  "Колхозная улица",
  "Комсомольская улица",
  "Короленко улица",
  "Лазаревская улица",
  "Лермонтова улица",
  "Лесная улица",
  "Макаренко улица",
  "Мамайская улица",
  "Мацестинская улица",
  "Мира улица",
  "Новороссийская улица",
  "Первомайская улица",
  "Пионерская улица",
  "Подгорная улица",
  "Полтавская улица",
  "Приморская улица",
  "Пушкина улица",
  "Революции улица",
  "Рахманинова улица",
  "Свердлова улица",
  "Северная улица",
  "Солнечная улица",
  "Транспортная улица",
  "Фабрициуса улица",
  "Цюрупы улица",
  "Чайковского улица",
  "Школьная улица",
  "Юных Ленинцев улица"
];

export const useAddressAutocomplete = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const filtered = SOCHI_STREETS.filter(street =>
      street.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5); // Показываем максимум 5 вариантов

    setSuggestions(filtered);
    setIsOpen(filtered.length > 0);
  }, [query]);

  const selectAddress = (address: string) => {
    setQuery(address);
    setIsOpen(false);
  };

  const clearQuery = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
  };

  return {
    query,
    setQuery,
    suggestions,
    isOpen,
    setIsOpen,
    selectAddress,
    clearQuery
  };
};