export const formatPhoneNumber = (value: string): string => {
  // Убираем все символы кроме цифр
  const digits = value.replace(/\D/g, '');
  
  // Если начинается с 8, заменяем на 7
  const normalizedDigits = digits.startsWith('8') ? '7' + digits.slice(1) : digits;
  
  // Если не начинается с 7, добавляем 7
  const withCountryCode = normalizedDigits.startsWith('7') ? normalizedDigits : '7' + normalizedDigits;
  
  // Ограничиваем до 11 цифр (1 код страны + 10 цифр номера)
  const limitedDigits = withCountryCode.slice(0, 11);
  
  // Форматируем в нужный вид
  if (limitedDigits.length <= 1) {
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

export const validatePhoneNumber = (phone: string): boolean => {
  // Убираем все символы кроме цифр
  const digits = phone.replace(/\D/g, '');
  // Проверяем что есть ровно 11 цифр и начинается с 7
  return digits.length === 11 && digits.startsWith('7');
};

export const getCleanPhoneNumber = (phone: string): string => {
  return phone.replace(/\D/g, '');
};