import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Flower } from '../types/flower';

interface FavoritesState {
  items: Flower[];
  itemCount: number;
}

interface FavoritesContextType {
  state: FavoritesState;
  addToFavorites: (flower: Flower) => void;
  removeFromFavorites: (id: string) => void;
  isFavorite: (id: string) => boolean;
  clearFavorites: () => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

type FavoritesAction =
  | { type: 'ADD_TO_FAVORITES'; payload: Flower }
  | { type: 'REMOVE_FROM_FAVORITES'; payload: string }
  | { type: 'CLEAR_FAVORITES' }
  | { type: 'LOAD_FAVORITES'; payload: Flower[] };

const calculateTotals = (items: Flower[]): FavoritesState => {
  return {
    items,
    itemCount: items.length,
  };
};

const favoritesReducer = (state: FavoritesState, action: FavoritesAction): FavoritesState => {
  switch (action.type) {
    case 'ADD_TO_FAVORITES': {
      const existingItem = state.items.find(item => item.id === action.payload.id);
      if (existingItem) {
        return state; // Item already in favorites
      }
      const newItems = [...state.items, action.payload];
      return calculateTotals(newItems);
    }
    case 'REMOVE_FROM_FAVORITES': {
      const newItems = state.items.filter(item => item.id !== action.payload);
      return calculateTotals(newItems);
    }
    case 'CLEAR_FAVORITES':
      return calculateTotals([]);
    case 'LOAD_FAVORITES':
      return calculateTotals(action.payload);
    default:
      return state;
  }
};

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(favoritesReducer, {
    items: [],
    itemCount: 0,
  });

  // Load favorites from localStorage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      try {
        const parsedFavorites = JSON.parse(savedFavorites);
        dispatch({ type: 'LOAD_FAVORITES', payload: parsedFavorites });
      } catch (error) {
        console.error('Error loading favorites from localStorage:', error);
      }
    }
  }, []);

  // Save favorites to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(state.items));
  }, [state.items]);

  const addToFavorites = (flower: Flower) => {
    dispatch({ type: 'ADD_TO_FAVORITES', payload: flower });
  };

  const removeFromFavorites = (id: string) => {
    dispatch({ type: 'REMOVE_FROM_FAVORITES', payload: id });
  };

  const isFavorite = (id: string) => {
    return state.items.some(item => item.id === id);
  };

  const clearFavorites = () => {
    dispatch({ type: 'CLEAR_FAVORITES' });
  };

  return (
    <FavoritesContext.Provider 
      value={{ 
        state, 
        addToFavorites, 
        removeFromFavorites, 
        isFavorite,
        clearFavorites 
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = (): FavoritesContextType => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};