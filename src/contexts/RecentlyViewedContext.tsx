import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';

export const RECENTLY_VIEWED_STORAGE_KEY = 'mk-store-recently-viewed';
const STORAGE_KEY = RECENTLY_VIEWED_STORAGE_KEY;
const MAX_RECENT = 5;

export interface RecentItem {
  id: number | string;
  label: string;
}

interface RecentlyViewedState {
  orders: RecentItem[];
  products: RecentItem[];
}

const defaultState: RecentlyViewedState = { orders: [], products: [] };

function loadFromStorage(): RecentlyViewedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as RecentlyViewedState;
    return {
      orders: Array.isArray(parsed.orders) ? parsed.orders.slice(0, MAX_RECENT) : [],
      products: Array.isArray(parsed.products) ? parsed.products.slice(0, MAX_RECENT) : [],
    };
  } catch {
    return defaultState;
  }
}

function saveToStorage(state: RecentlyViewedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

type RecentlyViewedContextValue = {
  orders: RecentItem[];
  products: RecentItem[];
  addOrder: (id: number | string, label: string) => void;
  addProduct: (id: number | string, label: string) => void;
};

const RecentlyViewedContext = createContext<RecentlyViewedContextValue | null>(null);

export function RecentlyViewedProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<RecentlyViewedState>(loadFromStorage);

  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  const addOrder = useCallback((id: number | string, label: string) => {
    setState((prev) => {
      const next = prev.orders.filter((o) => String(o.id) !== String(id));
      next.unshift({ id, label: label || `Order #${id}` });
      return { ...prev, orders: next.slice(0, MAX_RECENT) };
    });
  }, []);

  const addProduct = useCallback((id: number | string, label: string) => {
    setState((prev) => {
      const next = prev.products.filter((p) => String(p.id) !== String(id));
      next.unshift({ id, label: label || `Product #${id}` });
      return { ...prev, products: next.slice(0, MAX_RECENT) };
    });
  }, []);

  const value: RecentlyViewedContextValue = {
    orders: state.orders,
    products: state.products,
    addOrder,
    addProduct,
  };

  return (
    <RecentlyViewedContext.Provider value={value}>
      {children}
    </RecentlyViewedContext.Provider>
  );
}

export function useRecentlyViewed(): RecentlyViewedContextValue {
  const ctx = useContext(RecentlyViewedContext);
  if (!ctx) return {
    orders: [],
    products: [],
    addOrder: () => {},
    addProduct: () => {},
  };
  return ctx;
}
