import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { childrenApi } from '../services/api';
import type { Child } from '../types';

interface ChildContextType {
  children: Child[];
  selectedChild: Child | null;
  setSelectedChild: (child: Child | null) => void;
  fetchChildren: () => Promise<void>;
  createChild: (data: { name: string; age: number; grade?: number }) => Promise<Child>;
  updateChild: (id: number, data: Partial<Child>) => Promise<Child>;
  deleteChild: (id: number) => Promise<void>;
  isLoading: boolean;
}

const ChildContext = createContext<ChildContextType | undefined>(undefined);

export function ChildProvider({ children }: { children: ReactNode }) {
  const [childrenList, setChildrenList] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchChildren = async () => {
    setIsLoading(true);
    try {
      const response = await childrenApi.list();
      setChildrenList(response.data);
      const stored = localStorage.getItem('selectedChildId');
      if (stored) {
        const child = response.data.find(c => c.id === parseInt(stored));
        if (child) setSelectedChild(child);
      } else if (response.data.length > 0) {
        setSelectedChild(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch children:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChildren();
  }, []);

  const createChild = async (data: { name: string; age: number; grade?: number }) => {
    const response = await childrenApi.create(data);
    await fetchChildren();
    return response.data;
  };

  const updateChild = async (id: number, data: Partial<Child>) => {
    const response = await childrenApi.update(id, data);
    await fetchChildren();
    return response.data;
  };

  const deleteChild = async (id: number) => {
    await childrenApi.delete(id);
    await fetchChildren();
  };

  const handleSetSelectedChild = (child: Child | null) => {
    setSelectedChild(child);
    if (child) {
      localStorage.setItem('selectedChildId', child.id.toString());
    } else {
      localStorage.removeItem('selectedChildId');
    }
  };

  return (
    <ChildContext.Provider value={{
      children: childrenList,
      selectedChild,
      setSelectedChild: handleSetSelectedChild,
      fetchChildren,
      createChild,
      updateChild,
      deleteChild,
      isLoading,
    }}>
      {children}
    </ChildContext.Provider>
  );
}

export function useChildren() {
  const context = useContext(ChildContext);
  if (!context) {
    throw new Error('useChildren must be used within a ChildProvider');
  }
  return context;
}