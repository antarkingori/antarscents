'use client';
import { useState, useEffect, useCallback } from 'react';
import { categoriesApi } from '@/lib/api';
import { Plus, Trash2, Edit2, Check, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Category {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  active: boolean;
  created_at: string;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await categoriesApi.getAllAdmin();
      setCategories(data.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const slug = newName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      await categoriesApi.create({ name: newName.trim(), slug, sort_order: categories.length });
      setNewName('');
      toast.success('Category added');
      fetchCategories();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to add category');
    } finally {
      setAdding(false);
    }
  };

  const handleToggleActive = async (cat: Category) => {
    try {
      await categoriesApi.update(cat.id, { active: !cat.active });
      toast.success(cat.active ? 'Category hidden from shop' : 'Category visible in shop');
      fetchCategories();
    } catch {
      toast.error('Failed to update category');
    }
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) return;
    try {
      const slug = editName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      await categoriesApi.update(id, { name: editName.trim(), slug });
      setEditingId(null);
      toast.success('Category updated');
      fetchCategories();
    } catch {
      toast.error('Failed to update category');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category? Products using it won\'t be affected.')) return;
    try {
      await categoriesApi.delete(id);
      toast.success('Category deleted');
      fetchCategories();
    } catch {
      toast.error('Failed to delete category');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-playfair text-2xl font-bold">Categories</h1>
        <p className="text-gray-400 text-sm mt-1">Manage shop filter categories. Changes appear in the shop immediately.</p>
      </div>

      <form onSubmit={handleAdd} className="flex gap-3 max-w-md">
        <input
          type="text"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="Category name (e.g. Women, Luxury, Oud)"
          className="input-dark flex-1 text-sm"
        />
        <button type="submit" disabled={adding || !newName.trim()} className="btn-gold px-4 py-2 text-sm flex items-center gap-2 whitespace-nowrap">
          {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          Add
        </button>
      </form>

      <div className="bg-[#111] border border-[#1A1A1A] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1A1A1A] text-gray-500 text-xs">
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">URL Slug</th>
              <th className="text-left px-4 py-3 font-medium">Visible in Shop</th>
              <th className="text-left px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="text-center py-12"><Loader2 size={24} className="animate-spin text-gold mx-auto" /></td></tr>
            ) : categories.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-12 text-gray-500">No categories yet. Add one above.</td></tr>
            ) : categories.map(cat => (
              <tr key={cat.id} className="border-b border-[#0D0D0D] hover:bg-[#0D0D0D] transition-colors">
                <td className="px-4 py-3">
                  {editingId === cat.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="input-dark text-sm py-1 px-2 w-40"
                        autoFocus
                        onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(cat.id); if (e.key === 'Escape') setEditingId(null); }}
                      />
                      <button onClick={() => handleSaveEdit(cat.id)} className="text-green-400 hover:text-green-300"><Check size={14} /></button>
                      <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-red-400"><X size={14} /></button>
                    </div>
                  ) : (
                    <span className="font-medium">{cat.name}</span>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-400">{cat.slug}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggleActive(cat)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${cat.active ? 'bg-gold' : 'bg-gray-700'}`}
                    title={cat.active ? 'Click to hide' : 'Click to show'}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${cat.active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setEditingId(cat.id); setEditName(cat.name); }}
                      className="p-1.5 hover:text-gold transition-colors"
                      title="Rename"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="p-1.5 hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-600">
        The URL slug is used for filtering — it should match the product type set on your products. Changing a slug won&apos;t break existing products but will change how filtering maps.
      </p>
    </div>
  );
}
