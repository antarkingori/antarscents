'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { productsApi, categoriesApi } from '@/lib/api';
import { formatKES } from '@/lib/utils';
import Modal from '@/components/ui/Modal';
import { useDropzone } from 'react-dropzone';
import {
  Plus, Search, Edit2, Trash2, Upload, Loader2, X, Check, Link2,
  ArrowLeft, ImageIcon, PlusCircle, GripVertical, Pencil,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Variant { option_value: string; price: string; sku: string }
interface ProductImage { src: string }

interface Product {
  id: string;
  title: string;
  handle: string;
  vendor?: string;
  product_type?: string;
  tags?: string[];
  body_html?: string;
  status: string;
  images?: ProductImage[];
  variants?: Record<string, unknown>[];
  selling_price: number;
  buying_price?: number;
}

interface Category { id: string; name: string; slug: string }

const emptyForm = {
  title: '', handle: '', vendor: '', product_type: '',
  body_html: '', status: 'active', selling_price: '', buying_price: '', tags: '',
};
const emptyVariant = (): Variant => ({ option_value: '', price: '', sku: '' });

// ── Image Manager ─────────────────────────────────────────────────────────────
function ImageManager({
  images, setImages, compact = false,
}: {
  images: ProductImage[];
  setImages: React.Dispatch<React.SetStateAction<ProductImage[]>>;
  compact?: boolean;
}) {
  const [urlInput, setUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const addByUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (images.find(i => i.src === trimmed)) { toast.error('Image already added'); return; }
    setImages(prev => [...prev, { src: trimmed }]);
    setUrlInput('');
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data } = await productsApi.uploadImage(file);
      setImages(prev => [...prev, { src: data.data.url }]);
      toast.success('Image uploaded');
    } catch {
      toast.error('Upload failed — try pasting an image URL instead, or create a "product-images" bucket in Supabase Storage.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const moveToFirst = (i: number) => {
    setImages(prev => { const a = [...prev]; const [img] = a.splice(i, 1); return [img, ...a]; });
  };

  const remove = (i: number) => setImages(prev => prev.filter((_, j) => j !== i));

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className={`relative rounded-xl bg-[#0D0D0D] border-2 border-dashed ${images.length ? 'border-[#222]' : 'border-[#333]'} overflow-hidden ${compact ? 'aspect-square' : 'aspect-[4/3]'}`}>
        {images.length > 0 ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={images[0].src} alt="Main" className="w-full h-full object-cover" onError={e => (e.currentTarget.src = '/placeholder-perfume.jpg')} />
            <div className="absolute top-2 left-2 bg-black/70 text-gold text-xs px-2 py-0.5 rounded font-medium">Main Image</div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-600 py-8">
            <ImageIcon size={compact ? 28 : 40} className="mb-2" />
            <p className="text-xs">No images yet</p>
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {images.map((img, i) => (
            <div key={i} className="relative group w-14 h-14 flex-shrink-0">
              <button
                type="button"
                onClick={() => moveToFirst(i)}
                title="Set as main image"
                className={`w-full h-full rounded-lg overflow-hidden border-2 transition-colors ${i === 0 ? 'border-gold' : 'border-[#333] hover:border-gold/50'}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.src} alt="" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
              </button>
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                <X size={9} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add by URL */}
      <div className="flex gap-2">
        <input
          type="url"
          value={urlInput}
          onChange={e => setUrlInput(e.target.value)}
          placeholder="Paste image URL..."
          className="input-dark text-sm flex-1 min-w-0"
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addByUrl(); } }}
        />
        <button type="button" onClick={addByUrl} disabled={!urlInput.trim()} className="btn-outline-gold px-3 py-2 text-sm whitespace-nowrap disabled:opacity-40">Add</button>
      </div>

      {/* Upload file */}
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleFile} />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-gold cursor-pointer transition-colors"
      >
        {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
        {uploading ? 'Uploading...' : 'Upload from device'}
      </button>
    </div>
  );
}

// ── Variants Editor ───────────────────────────────────────────────────────────
function VariantsEditor({
  variants, setVariants, basePrice,
}: {
  variants: Variant[];
  setVariants: React.Dispatch<React.SetStateAction<Variant[]>>;
  basePrice: string;
}) {
  const add = () => setVariants(prev => [...prev, { ...emptyVariant(), price: basePrice || '0' }]);
  const remove = (i: number) => setVariants(prev => prev.filter((_, j) => j !== i));
  const update = (i: number, field: keyof Variant, value: string) =>
    setVariants(prev => prev.map((v, j) => j === i ? { ...v, [field]: value } : v));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-300">Variants / Sizes</p>
        <button type="button" onClick={add} className="flex items-center gap-1.5 text-gold hover:text-gold/80 text-xs font-medium transition-colors">
          <PlusCircle size={14} /> Add option
        </button>
      </div>

      {variants.length === 0 ? (
        <p className="text-xs text-gray-500 border border-dashed border-[#333] rounded-lg p-3 text-center">
          No variants — product will use the base selling price.<br />Add variants for different sizes (e.g. 30ml, 50ml, 100ml).
        </p>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-12 gap-2 text-xs text-gray-500 px-1">
            <span className="col-span-5">Option / Size</span>
            <span className="col-span-4">Price (KES)</span>
            <span className="col-span-2">SKU</span>
            <span className="col-span-1" />
          </div>
          {variants.map((v, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-5">
                <input
                  type="text"
                  value={v.option_value}
                  onChange={e => update(i, 'option_value', e.target.value)}
                  placeholder="e.g. 50ml"
                  className="input-dark text-sm w-full"
                />
              </div>
              <div className="col-span-4">
                <input
                  type="number"
                  value={v.price}
                  onChange={e => update(i, 'price', e.target.value)}
                  placeholder={basePrice || '0'}
                  className="input-dark text-sm w-full"
                />
              </div>
              <div className="col-span-2">
                <input
                  type="text"
                  value={v.sku}
                  onChange={e => update(i, 'sku', e.target.value)}
                  placeholder="SKU"
                  className="input-dark text-sm w-full"
                />
              </div>
              <button type="button" onClick={() => remove(i)} className="col-span-1 text-gray-600 hover:text-red-400 transition-colors flex justify-center">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Product Form Fields ───────────────────────────────────────────────────────
function ProductFormFields({
  f, setF, categories,
}: {
  f: typeof emptyForm;
  setF: React.Dispatch<React.SetStateAction<typeof emptyForm>>;
  categories: Category[];
}) {
  const autoHandle = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Title *</label>
        <input
          type="text" value={f.title} required className="input-dark text-sm w-full"
          onChange={e => setF(p => ({ ...p, title: e.target.value, handle: p.handle || autoHandle(e.target.value) }))}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">URL Handle *</label>
        <input
          type="text" value={f.handle} required className="input-dark text-sm w-full font-mono"
          onChange={e => setF(p => ({ ...p, handle: e.target.value }))}
          placeholder="product-url-slug"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Vendor / Brand</label>
          <input type="text" value={f.vendor} className="input-dark text-sm w-full"
            onChange={e => setF(p => ({ ...p, vendor: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Category</label>
          <input
            list="cat-list" type="text" value={f.product_type} placeholder="Select or type..."
            className="input-dark text-sm w-full"
            onChange={e => setF(p => ({ ...p, product_type: e.target.value }))}
          />
          <datalist id="cat-list">
            {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
          </datalist>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Selling Price (KES) *</label>
          <input type="number" value={f.selling_price} required min="0" className="input-dark text-sm w-full"
            onChange={e => setF(p => ({ ...p, selling_price: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Cost Price (KES)</label>
          <input type="number" value={f.buying_price} min="0" className="input-dark text-sm w-full"
            onChange={e => setF(p => ({ ...p, buying_price: e.target.value }))} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Status</label>
          <select value={f.status} className="input-dark text-sm w-full"
            onChange={e => setF(p => ({ ...p, status: e.target.value }))}>
            {['active', 'draft', 'archived'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Tags</label>
          <input type="text" value={f.tags} placeholder="floral, woody, fresh" className="input-dark text-sm w-full"
            onChange={e => setF(p => ({ ...p, tags: e.target.value }))} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
        <textarea value={f.body_html} rows={5} className="input-dark text-sm w-full resize-y"
          placeholder="Product description (HTML supported)..."
          onChange={e => setF(p => ({ ...p, body_html: e.target.value }))} />
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Add / Edit modal
  const [formOpen, setFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formImages, setFormImages] = useState<ProductImage[]>([]);
  const [formVariants, setFormVariants] = useState<Variant[]>([]);
  const [saving, setSaving] = useState(false);

  // CSV import modal
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  // URL import full-screen panel
  const [urlImportOpen, setUrlImportOpen] = useState(false);
  const [urlImportStep, setUrlImportStep] = useState<'input' | 'preview'>('input');
  const [importUrl, setImportUrl] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [urlForm, setUrlForm] = useState(emptyForm);
  const [urlImages, setUrlImages] = useState<ProductImage[]>([]);
  const [urlVariants, setUrlVariants] = useState<Variant[]>([]);

  // Inline price edit
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [editPriceVal, setEditPriceVal] = useState('');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (search) params.search = search;
      const { data } = await productsApi.getAll(params);
      setProducts(data.data || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { categoriesApi.getAllAdmin().then(({ data }) => setCategories(data.data || [])).catch(() => {}); }, []);

  const openAdd = () => {
    setEditProduct(null);
    setForm(emptyForm);
    setFormImages([]);
    setFormVariants([]);
    setFormOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setForm({
      title: p.title, handle: p.handle, vendor: p.vendor || '',
      product_type: p.product_type || '', body_html: p.body_html || '',
      status: p.status, selling_price: String(p.selling_price),
      buying_price: String(p.buying_price || ''), tags: p.tags?.join(', ') || '',
    });
    setFormImages(p.images || []);
    setFormVariants((p.variants || []).map(v => ({
      option_value: String((v as Record<string, unknown>).option_value || ''),
      price: String((v as Record<string, unknown>).price || p.selling_price || '0'),
      sku: String((v as Record<string, unknown>).sku || ''),
    })));
    setFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        selling_price: parseFloat(form.selling_price) || 0,
        buying_price: form.buying_price ? parseFloat(form.buying_price) : undefined,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        images: formImages,
        variants: formVariants.length > 0 ? formVariants.map(v => ({
          option_value: v.option_value,
          price: parseFloat(v.price) || parseFloat(form.selling_price) || 0,
          sku: v.sku || undefined,
        })) : [],
      };
      if (editProduct) {
        await productsApi.update(editProduct.id, payload);
        toast.success('Product updated');
      } else {
        await productsApi.create(payload);
        toast.success('Product created');
      }
      setFormOpen(false);
      fetchProducts();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    try { await productsApi.delete(id); toast.success('Deleted'); fetchProducts(); }
    catch { toast.error('Delete failed'); }
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImporting(true);
    try {
      const { data } = await productsApi.importCsv(importFile);
      toast.success(data.message);
      setImportOpen(false);
      setImportFile(null);
      fetchProducts();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const savePriceInline = async (id: string) => {
    try {
      await productsApi.update(id, { selling_price: parseFloat(editPriceVal) });
      toast.success('Price updated');
      setEditingPrice(null);
      fetchProducts();
    } catch { toast.error('Failed'); }
  };

  const handleExtractUrl = async () => {
    if (!importUrl.trim()) return;
    setExtracting(true);
    try {
      const { data } = await productsApi.importUrl(importUrl.trim());
      const ex = data.data;
      setUrlForm({
        title: ex.title || '', handle: ex.handle || '', vendor: ex.vendor || '',
        product_type: ex.product_type || '', body_html: ex.body_html || '',
        status: 'draft', selling_price: ex.selling_price ? String(ex.selling_price) : '',
        buying_price: '', tags: (ex.tags || []).join(', '),
      });
      setUrlImages(ex.images || []);
      setUrlVariants((ex.variants || []).map((v: Record<string, unknown>) => ({
        option_value: String(v.option_value || ''),
        price: String(v.price || ex.selling_price || '0'),
        sku: String(v.sku || ''),
      })));
      setUrlImportStep('preview');
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Could not extract product. Try a direct product URL.');
    } finally {
      setExtracting(false);
    }
  };

  const handleSaveUrlProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await productsApi.create({
        ...urlForm,
        selling_price: parseFloat(urlForm.selling_price) || 0,
        buying_price: urlForm.buying_price ? parseFloat(urlForm.buying_price) : undefined,
        tags: urlForm.tags ? urlForm.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        images: urlImages,
        variants: urlVariants.length > 0 ? urlVariants.map(v => ({
          option_value: v.option_value,
          price: parseFloat(v.price) || parseFloat(urlForm.selling_price) || 0,
          sku: v.sku || undefined,
        })) : [],
      });
      toast.success('Product imported!');
      setUrlImportOpen(false);
      setUrlImportStep('input');
      setImportUrl('');
      fetchProducts();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Import failed');
    } finally {
      setSaving(false);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'text/csv': ['.csv'] }, maxFiles: 1, onDrop: files => setImportFile(files[0] || null),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-playfair text-2xl font-bold">Products</h1>
          <p className="text-gray-400 text-sm mt-1">{total} products</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setImportOpen(true)} className="btn-outline-gold px-4 py-2 text-sm flex items-center gap-2">
            <Upload size={16} /> Import CSV
          </button>
          <button onClick={() => { setUrlImportOpen(true); setUrlImportStep('input'); setImportUrl(''); setUrlImages([]); setUrlVariants([]); }}
            className="btn-outline-gold px-4 py-2 text-sm flex items-center gap-2">
            <Link2 size={16} /> Import from URL
          </button>
          <button onClick={openAdd} className="btn-gold px-4 py-2 text-sm flex items-center gap-2">
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search products..." className="input-dark pl-9 w-full" />
      </div>

      {/* Table */}
      <div className="bg-[#111] border border-[#1A1A1A] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1A1A1A] text-gray-500 text-xs">
                {['Image', 'Title', 'Vendor', 'Category', 'Selling Price', 'Cost', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-16"><Loader2 size={24} className="animate-spin text-gold mx-auto" /></td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-16 text-gray-500">No products found</td></tr>
              ) : products.map(p => (
                <tr key={p.id} className="border-b border-[#0D0D0D] hover:bg-[#0D0D0D] transition-colors">
                  <td className="px-4 py-3">
                    <div className="relative w-10 h-10 rounded-lg bg-[#1A1A1A] overflow-hidden flex-shrink-0">
                      {p.images?.[0]?.src && (
                        <Image src={p.images[0].src} alt={p.title} fill className="object-cover" sizes="40px" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    <p className="font-medium truncate">{p.title}</p>
                    <p className="text-gray-500 text-xs truncate font-mono">{p.handle}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{p.vendor || '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{p.product_type || '—'}</td>
                  <td className="px-4 py-3">
                    {editingPrice === p.id ? (
                      <div className="flex items-center gap-1">
                        <input type="number" value={editPriceVal} onChange={e => setEditPriceVal(e.target.value)}
                          className="input-dark w-24 text-xs py-1 px-2" autoFocus
                          onKeyDown={e => e.key === 'Enter' && savePriceInline(p.id)} />
                        <button onClick={() => savePriceInline(p.id)} className="text-green-400 hover:text-green-300"><Check size={14} /></button>
                        <button onClick={() => setEditingPrice(null)} className="text-gray-500 hover:text-red-400"><X size={14} /></button>
                      </div>
                    ) : (
                      <button onClick={() => { setEditingPrice(p.id); setEditPriceVal(String(p.selling_price)); }}
                        className="hover:text-gold transition-colors flex items-center gap-1 group">
                        {formatKES(p.selling_price)}
                        <Pencil size={11} className="opacity-0 group-hover:opacity-60" />
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{p.buying_price ? formatKES(p.buying_price) : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs capitalize font-medium ${p.status === 'active' ? 'bg-green-500/20 text-green-400' : p.status === 'draft' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(p)} className="p-1.5 hover:text-gold transition-colors" title="Edit"><Edit2 size={15} /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 hover:text-red-400 transition-colors" title="Delete"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {total > 20 && (
          <div className="flex justify-center gap-2 p-4 border-t border-[#1A1A1A]">
            {page > 1 && <button onClick={() => setPage(p => p - 1)} className="btn-outline-gold px-4 py-1.5 text-sm">Previous</button>}
            {products.length === 20 && <button onClick={() => setPage(p => p + 1)} className="btn-gold px-4 py-1.5 text-sm">Next</button>}
          </div>
        )}
      </div>

      {/* ── Add / Edit Modal ── */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editProduct ? `Edit: ${editProduct.title}` : 'Add New Product'} size="xl">
        <form onSubmit={handleSave}>
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left: Images */}
            <div className="lg:w-72 flex-shrink-0">
              <ImageManager images={formImages} setImages={setFormImages} />
            </div>
            {/* Right: Fields + Variants */}
            <div className="flex-1 min-w-0 space-y-5">
              <ProductFormFields f={form} setF={setForm} categories={categories} />
              <hr className="border-[#1A1A1A]" />
              <VariantsEditor variants={formVariants} setVariants={setFormVariants} basePrice={form.selling_price} />
            </div>
          </div>
          <div className="flex gap-3 pt-5 mt-5 border-t border-[#1A1A1A]">
            <button type="submit" disabled={saving} className="btn-gold px-6 py-2.5 font-semibold text-sm flex items-center gap-2 disabled:opacity-50">
              {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : (editProduct ? 'Update Product' : 'Create Product')}
            </button>
            <button type="button" onClick={() => setFormOpen(false)} className="btn-outline-gold px-6 py-2.5 text-sm">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* ── CSV Import Modal ── */}
      <Modal open={importOpen} onClose={() => setImportOpen(false)} title="Import Products from CSV" size="md">
        <div className="space-y-4">
          <p className="text-sm text-gray-400">Upload a Shopify-format CSV file to bulk import products.</p>
          <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${importFile ? 'border-gold/50 bg-gold/5' : 'border-[#333] hover:border-gold/30'}`}>
            <input {...getInputProps()} />
            {importFile ? (
              <div><p className="text-gold font-medium">{importFile.name}</p><p className="text-gray-400 text-sm mt-1">{(importFile.size / 1024).toFixed(1)} KB</p></div>
            ) : (
              <div><Upload size={32} className="mx-auto text-gray-500 mb-3" /><p className="text-gray-300 text-sm">Drop CSV file or click to choose</p><p className="text-gray-500 text-xs mt-1">Shopify product export format</p></div>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={handleImport} disabled={!importFile || importing} className="btn-gold flex-1 py-2.5 text-sm font-semibold flex items-center justify-center gap-2">
              {importing ? <><Loader2 size={16} className="animate-spin" /> Importing...</> : 'Import All'}
            </button>
            <button onClick={() => { setImportOpen(false); setImportFile(null); }} className="btn-outline-gold px-4 py-2.5 text-sm">Cancel</button>
          </div>
        </div>
      </Modal>

      {/* ── URL Import Full-Screen Panel ── */}
      {urlImportOpen && (
        <div className="fixed inset-0 z-50 bg-[#0A0A0A] flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-[#1A1A1A] bg-[#0D0D0D]">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => { setUrlImportOpen(false); setUrlImportStep('input'); }} className="p-2 hover:text-gold transition-colors rounded-lg hover:bg-[#1A1A1A]">
                <X size={20} />
              </button>
              <div>
                <h1 className="font-playfair text-lg font-bold">Import Product from URL</h1>
                <p className="text-gray-500 text-xs">Amazon · AliExpress · Alibaba · Any product page</p>
              </div>
            </div>
            {urlImportStep === 'preview' && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 hidden sm:block">Status: <span className="text-yellow-400">Draft</span> — review before publishing</span>
                <button type="button" onClick={() => setUrlImportStep('input')} className="btn-outline-gold px-4 py-2 text-sm flex items-center gap-2">
                  <ArrowLeft size={15} /> Back
                </button>
                <button type="button" onClick={handleSaveUrlProduct} disabled={saving} className="btn-gold px-6 py-2 text-sm font-semibold flex items-center gap-2">
                  {saving ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : 'Import Product'}
                </button>
              </div>
            )}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-hidden">
            {urlImportStep === 'input' ? (
              <div className="max-w-xl mx-auto py-12 px-6 space-y-6">
                <div className="bg-[#111] border border-[#1A1A1A] rounded-xl p-5 space-y-2 text-sm text-gray-400">
                  <p className="text-white font-medium mb-3">How it works</p>
                  <p>1. Open any product page on Amazon, AliExpress, or Alibaba</p>
                  <p>2. Copy the URL from your browser&apos;s address bar</p>
                  <p>3. Paste it below — we&apos;ll extract the title, images, price, and description</p>
                  <p>4. Review and edit the details, then save as a draft</p>
                  <p className="text-yellow-400/80 text-xs pt-2 border-t border-[#1A1A1A] mt-2">Note: some sites block automated access. If extraction fails, use &quot;Add Product&quot; to enter details manually.</p>
                </div>
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-300">Product URL</label>
                  <input
                    type="url" value={importUrl} onChange={e => setImportUrl(e.target.value)}
                    placeholder="https://www.amazon.com/dp/..."
                    className="input-dark w-full text-sm" autoFocus
                    onKeyDown={e => e.key === 'Enter' && handleExtractUrl()}
                  />
                  <button onClick={handleExtractUrl} disabled={!importUrl.trim() || extracting}
                    className="btn-gold w-full py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
                    {extracting ? <><Loader2 size={18} className="animate-spin" /> Extracting product data...</> : <><Link2 size={18} /> Extract Product</>}
                  </button>
                </div>
              </div>
            ) : (
              // Shopify-like 2-column preview
              <form onSubmit={handleSaveUrlProduct} className="flex h-full overflow-hidden">
                {/* Left: Media */}
                <div className="w-full sm:w-80 lg:w-96 flex-shrink-0 border-r border-[#1A1A1A] p-6 overflow-y-auto bg-[#0D0D0D]">
                  <p className="text-sm font-semibold text-gray-300 mb-4">
                    Media
                    <span className="text-gray-500 font-normal ml-1">({urlImages.length} image{urlImages.length !== 1 ? 's' : ''} extracted)</span>
                  </p>
                  <ImageManager images={urlImages} setImages={setUrlImages} />
                  <p className="text-xs text-gray-600 mt-3">Click a thumbnail to set it as the main image. Click × to remove.</p>
                </div>

                {/* Right: Product info */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-4 font-medium">Product Information</p>
                    <ProductFormFields f={urlForm} setF={setUrlForm} categories={categories} />
                  </div>
                  <hr className="border-[#1A1A1A]" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-4 font-medium">Variants & Options</p>
                    <VariantsEditor variants={urlVariants} setVariants={setUrlVariants} basePrice={urlForm.selling_price} />
                  </div>
                  <div className="pb-6">
                    <div className="bg-[#111] border border-[#1A1A1A] rounded-xl p-4 text-xs text-gray-500 space-y-1">
                      <p className="text-gray-300 font-medium">Source</p>
                      <p className="truncate text-blue-400/70">{importUrl}</p>
                      <p>This product will be saved as a <span className="text-yellow-400">draft</span>. Set it to <span className="text-green-400">active</span> when ready to publish.</p>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
