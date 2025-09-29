import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Flower, CartItem } from '../types/flower';

/** Расширим CartItem: теперь он может содержать вариант */
export interface CartItemWithVariant extends CartItem {
  variantId?: string;
  variantName?: string;
  price: number; // всегда фиксируем цену варианта
}

interface CartState {
  items: CartItemWithVariant[];
  total: number;
  itemCount: number;
}

interface CartContextType {
  state: CartState;
  addToCart: (flower: Flower, options?: { variantId?: string; variantName?: string; price?: number }) => void;
  removeFromCart: (id: string, variantId?: string) => void;
  updateQuantity: (id: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
}

type CartAction =
  | { type: 'ADD_TO_CART'; payload: CartItemWithVariant }
  | { type: 'REMOVE_FROM_CART'; payload: { id: string; variantId?: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number; variantId?: string } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartItemWithVariant[] };

const CartContext = createContext<CartContextType | undefined>(undefined);

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const existingItem = state.items.find(
        item =>
          item.id === action.payload.id &&
          item.variantId === action.payload.variantId
      );

      let newItems: CartItemWithVariant[];
      if (existingItem) {
        newItems = state.items.map(item =>
          item.id === action.payload.id && item.variantId === action.payload.variantId
            ? { ...item, cartQuantity: item.cartQuantity + 1 }
            : item
        );
      } else {
        newItems = [...state.items, { ...action.payload, cartQuantity: 1 }];
      }

      return calculateTotals(newItems);
    }

    case 'REMOVE_FROM_CART': {
      const newItems = state.items.filter(
        item =>
          !(item.id === action.payload.id && item.variantId === action.payload.variantId)
      );
      return calculateTotals(newItems);
    }

    case 'UPDATE_QUANTITY': {
      const newItems = state.items
        .map(item =>
          item.id === action.payload.id && item.variantId === action.payload.variantId
            ? { ...item, cartQuantity: action.payload.quantity }
            : item
        )
        .filter(item => item.cartQuantity > 0);

      return calculateTotals(newItems);
    }

    case 'CLEAR_CART':
      return { items: [], total: 0, itemCount: 0 };

    case 'LOAD_CART':
      return calculateTotals(action.payload);

    default:
      return state;
  }
};

const calculateTotals = (items: CartItemWithVariant[]): CartState => {
  const total = items.reduce(
    (sum, item) => sum + item.price * item.cartQuantity,
    0
  );
  const itemCount = items.reduce((sum, item) => sum + item.cartQuantity, 0);

  return { items, total, itemCount };
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    total: 0,
    itemCount: 0,
  });

  // Загружаем корзину из localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_CART', payload: parsedCart });
      } catch (error) {
        console.error('Ошибка загрузки корзины:', error);
      }
    }
  }, []);

  // Сохраняем корзину
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state.items));
  }, [state.items]);

  const addToCart = (
    flower: Flower,
    options?: { variantId?: string; variantName?: string; price?: number }
  ) => {
    dispatch({
      type: 'ADD_TO_CART',
      payload: {
        ...flower,
        cartQuantity: 1,
        variantId: options?.variantId,
        variantName: options?.variantName,
        price: options?.price ?? flower.price,
      },
    });
  };

  const removeFromCart = (id: string, variantId?: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: { id, variantId } });
  };

  const updateQuantity = (id: string, quantity: number, variantId?: string) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity, variantId } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  return (
    <CartContext.Provider
      value={{
        state,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
