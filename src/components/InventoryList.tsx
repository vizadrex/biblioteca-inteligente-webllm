import React, { useState } from 'react';
import { useInventory } from '../contexts/InventoryContext';
import { Book as BookIcon, Trash2, Edit2, Plus, X, User as UserIcon } from 'lucide-react';
import type { Book } from '../types';

export const InventoryList: React.FC = () => {
  const { inventory, deleteItem, addItem, editItem } = useInventory();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Book | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    quantity: 0
  });

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({ title: '', author: '', description: '', quantity: 0 });
    setIsModalOpen(true);
  };

  const openEditModal = (book: Book) => {
    setEditingProduct(book);
    setFormData({
      title: book.title,
      author: book.author,
      description: book.description,
      quantity: book.quantity
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? Number(value) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      editItem(editingProduct.id, formData);
    } else {
      addItem(formData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="inventory-container">
      <div className="header">
        <div className="header-title">
          <h2><BookIcon size={24} /> Catálogo de Libros</h2>
          <span className="badge">{inventory.length} libros</span>
        </div>
        <button className="add-btn" onClick={openAddModal}>
          <Plus size={18} /> Agregar Libro
        </button>
      </div>
      
      <div className="books-grid">
        {inventory.length === 0 ? (
          <div className="empty-state">
            No hay libros en la biblioteca. ¡Pídele a la IA que añada algunos!
          </div>
        ) : (
          inventory.map((item) => (
            <div className="book-card" key={item.id}>
              <div className="book-card-header">
                <h3 className="book-title">{item.title}</h3>
                <div className="action-buttons">
                  <button className="edit-btn" onClick={() => openEditModal(item)} title="Editar libro">
                    <Edit2 size={16} />
                  </button>
                  <button className="delete-btn" onClick={() => deleteItem(item.id)} title="Eliminar libro">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="book-author">
                <UserIcon size={14} /> {item.author}
              </div>
              <p className="book-description">{item.description || 'Sin descripción.'}</p>
              
              <div className="book-card-footer">
                <div className="book-id">ID: {item.id.slice(0, 6)}</div>
                <div className={`stock-badge ${item.quantity > 0 ? 'in-stock' : 'out-of-stock'}`}>
                  {item.quantity} disponibles
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingProduct ? 'Editar Libro' : 'Agregar Libro'}</h3>
              <button className="close-btn" onClick={handleCloseModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Título del Libro</label>
                <input type="text" name="title" value={formData.title} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Autor</label>
                <input type="text" name="author" value={formData.author} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Descripción Amplia</label>
                <textarea 
                  name="description" 
                  value={formData.description} 
                  onChange={handleInputChange} 
                  rows={4}
                />
              </div>
              <div className="form-group">
                <label>Cantidad Disponible</label>
                <input type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} min="0" required />
              </div>
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={handleCloseModal}>Cancelar</button>
                <button type="submit" className="save-btn">{editingProduct ? 'Guardar Cambios' : 'Agregar Libro'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
