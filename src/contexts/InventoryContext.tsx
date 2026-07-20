import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Book } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface InventoryContextType {
  inventory: Book[];
  addItem: (item: Omit<Book, 'id'>) => Book;
  modifyItemQuantity: (query: string, amount: number, isRelative?: boolean) => Book | undefined;
  editItem: (id: string, updatedProduct: Omit<Book, 'id'>) => Book | undefined;
  deleteItem: (id: string) => boolean;
  getInventory: () => Book[];
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [inventory, setInventory] = useState<Book[]>(() => {
    const saved = localStorage.getItem('webllm-inventory-books');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [
      { id: '1', title: 'Cálculo de una variable', author: 'James Stewart', description: 'Libro base para el curso de Análisis Matemático. Contiene ejercicios resueltos y teoría de límites, derivadas e integrales.', quantity: 15 },
      { id: '2', title: 'Física para Ciencias e Ingeniería', author: 'Raymond A. Serway', description: 'Volumen 1. Conceptos de mecánica clásica, termodinámica y ondas. Esencial para los laboratorios de ciencias.', quantity: 8 },
      { id: '3', title: 'Ingeniería de Software: Un enfoque práctico', author: 'Roger S. Pressman', description: 'Metodologías ágiles, diseño de sistemas, y ciclo de vida del software. Usado en la facultad de Sistemas.', quantity: 5 }
    ];
  });

  useEffect(() => {
    localStorage.setItem('webllm-inventory-books', JSON.stringify(inventory));
  }, [inventory]);

  const addItem = (item: Omit<Book, 'id'>) => {
    const newItem = { ...item, id: uuidv4() };
    setInventory((prev) => [...prev, newItem]);
    return newItem;
  };

  const modifyItemQuantity = (query: string, amount: number, isRelative: boolean = true) => {
    let updatedItem: Book | undefined;
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id === String(query) || item.title.toLowerCase().includes(String(query).toLowerCase()) || item.author.toLowerCase().includes(String(query).toLowerCase())) {
          const newQty = isRelative ? item.quantity + amount : amount;
          updatedItem = { ...item, quantity: Math.max(0, newQty) };
          return updatedItem;
        }
        return item;
      })
    );
    return updatedItem;
  };

  const editItem = (id: string, updatedProduct: Omit<Book, 'id'>) => {
    let updatedItem: Book | undefined;
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          updatedItem = { ...item, ...updatedProduct };
          return updatedItem;
        }
        return item;
      })
    );
    return updatedItem;
  };

  const deleteItem = (idOrName: string) => {
    let found = false;
    setInventory((prev) => {
      const filtered = prev.filter((item) => {
        const isMatch = item.id === String(idOrName) || item.title.toLowerCase().includes(String(idOrName).toLowerCase()) || item.author.toLowerCase().includes(String(idOrName).toLowerCase());
        if (isMatch) found = true;
        return !isMatch;
      });
      return filtered;
    });
    return found;
  };

  const getInventory = () => {
    return inventory;
  };

  return (
    <InventoryContext.Provider value={{ inventory, addItem, modifyItemQuantity, editItem, deleteItem, getInventory }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
