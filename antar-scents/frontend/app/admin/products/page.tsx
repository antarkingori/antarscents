'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { productsApi, categoriesApi } from '@/lib/api';
import { formatKES } from '@/lib/utils';
import Modal from '@/components/ui/Modal';
import { useDropzone } from 'react-dropzone';
import { Plus, Search, Edit2, Trash2, Upload, Loader2, X, Check, Link2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  title: string;
  handle: string;
  vendor?: string;
  product_type?: string;
  tags?: string[];
  body_html?: string;
  status: string;
  images?: { src: string }[];
  variants?: Record<string, unknown>[];
  selling_price: number;
  buying_price?: number;
}

interface Category { id: string; name: string; slug: string }

const emptyForm = { title: '', handle: '', vendor: '', product_type: '', body_html: '', status: 'active', selling_price: '', buying_price: '', tags: '' };

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [urlImportOpen, setUrlImportOpen] = useState(false);
  const [urlImportStep, setUrlImportStep] = useState<'input' | 'preview'>('input');
  const [importUrl, setImportUrl] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [urlImages, setUrlImages] = useState<{ src: string }[]>([]);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [urlForm, setUrlForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
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

  useEffect(() => {
    categoriesApi.getAllAdmin().then(({ data }) => setCategories(data.data || [])).catch(() => {});
  }, []);

  const openAdd = () => { setEditProduct(null); setForm(emptyForm); setFormOpen(true); };
  const openEdit = (p: Product) => {
    setEditProduct(p);
    setForm({ title: p.title, handle: p.handle, vendor: p.vendor || '', product_type: p.product_type || '', body_html: p.body_html || '', status: p.status, selling_price: String(p.selling_price), buying_price: String(p.buying_price || ''), tags: p.tags?.join(', ') || '' });
    setFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, selling_price: parseFloat(form.selling_price), buying_price: form.buying_price ? parseFloat(form.buying_price) : undefined, tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [] };
      if (editProduct) { await productsApi.update(editProduct.id, payload); toast.success('Product updated'); }
      else { await productsApi.create(payload); toast.success('Product created'); }
      setFormOpen(false);
      fetchProducts();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      await productsApi.delete(id);
      toast.success('Product deleted');
      fetchProducts();
    } catch { toast.error('Delete failed'); }
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
    } catch { toast.error('Failed to update price'); }
  };

  const handleExtractUrl = async () => {
    if (!importUrl.trim()) return;
    setExtracting(true);
    try {
      const { data } = await productsApi.importUrl(importUrl.trim());
      const extracted = data.data;
      setUrlForm({
        title: extracted.title || '',
        handle: extracted.handle || '',
        vendor: extracted.vendor || '',
        product_type: extracted.product_type || '',
        body_html: extracted.body_html || '',
        status: 'draft',
        selling_price: extracted.selling_price ? String(extracted.selling_price) : '',
        buying_price: '',
        tags: (extracted.tags || []).join(', '),
      });
      setUrlImages(extracted.images || []);
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
      const payload = {
        ...urlForm,
        selling_price: parseFloat(urlForm.selling_price) || 0,
        buying_price: urlForm.buying_price ? parseFloat(urlForm.buying_price) : undefined,
        tags: urlForm.tags ? urlForm.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        images: urlImages,
      };
      await productsApi.create(payload);
      toast.success('Product imported!');
      setUrlImportOpen(false);
      setUrlImportStep('input');
      setImportUrl('');
      setUrlImages([]);
      fetchProducts();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to import product');
    } finally {
      setSaving(false);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({ accept: { 'text/csv': ['.csv'] }, maxFiles: 1, onDrop: files => setImportFile(files[0] || null) });

  const ProductFormFields = ({ f, setF }: { f: typeof emptyForm, setF: React.Dispatch<React.SetStateAction<typeof emptyForm>> }) => (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Title *</label>
          <input type="text" value={f.title} onChange={e => setF(p => ({ ...p, title: e.target.value, handle: p.handle || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }))} required className="input-dark text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Handle (URL slug) *</label>
          <input type="text" value={f.handle} onChange={e => setF(p => ({ ...p, handle: e.target.value }))} required className="input-dark text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Vendor</label>
          <input type="text" value={f.vendor} onChange={e => setF(p => ({ ...p, vendor: e.target.value }))} className="input-dark text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
          <input
            list="categories-list"
            type="text"
            value={f.product_type}
            onChange={e => setF(p => ({ ...p, product_type: e.target.value }))}
            placeholder="Select or type..."
            className="input-dark text-sm"
          />
          <datalist id="categories-list">
            {categories.map(c => <option key={c.id} value={c.slug} label={c.name} />)}
          </datalist>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Selling Price (KES) *</label>
          <input type="number" value={f.selling_price} onChange={e => setF(p => ({ ...p, selling_price: e.target.value }))} required className="input-dark text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Cost Price (KES — internal)</label>
          <input type="number" value={f.buying_price} onChange={e => setF(p => ({ ...p, buying_price: e.target.value }))} className="input-dark text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
          <select value={f.status} onChange={e => setF(p => ({ ...p, status: e.target.value }))} className="input-dark text-sm">
            {['active', 'draft', 'archived'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Tags (comma-separated)</label>
          <input type="text" value={f.tags} onChange={e => setF(p => ({ ...p, tags: e.target.value }))} className="input-dark text-sm" placeholder="floral, woody, fresh" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
        <textarea value={f.body_html} onChange={e => setF(p => ({ ...p, body_html: e.target.value }))} className="input-dark text-sm min-h-[100px] resize-none" placeholder="Product description..." />
      </div>
    </>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-playfair text-2xl font-bold">Products</h1>
          <p className="text-gray-400 text-sm mt-1">{total} products</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setImportOpen(true)} className="btn-outline-gold px-4 py-2 text-sm flex items-center gap-2"><Upload size={16} /> Import CSV</button>
          <button onClick={() => { setUrlImportOpen(true); setUrlImportStep('input'); setImportUrl(''); }} className="btn-outline-gold px-4 py-2 text-sm flex items-center gap-2"><Link2 size={16} /> Import from URL</button>
          <button onClick={openAdd} className="btn-gold px-4 py-2 text-sm flex items-center gap-2"><Plus size={16} /> Add Product</button>
        </div>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search by title..." className="input-dark pl-9 max-w-sm" />
      </div>

      <div className="bg-[#111] border border-[#1A1A1A] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-[#1A1A1A] text-gray-500 text-xs">
              {['Image', 'Title', 'Vendor', 'Selling Price', 'Buying Price', 'Status', 'Actions'].map(h => <th key={h} className="text-left px-4 py-3 font-medium whitespace-nowrap">{h}</th>)}
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-16"><Loader2 size={24} className="animate-spin text-gold mx-auto" /></td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16 text-gray-500">No products found</td></tr>
              ) : products.map(p => (
                <tr key={p.id} className="border-b border-[#0D0D0D] hover:bg-[#0D0D0D] transition-colors">
                  <td className="px-4 py-3">
                    <div className="relative w-10 h-10 rounded bg-[#1A1A1A] overflow-hidden">
                      {p.images?.[0]?.src && <Image src={p.images[0].src} alt={p.title} fill className="object-cover" sizes="40px" />}
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-[200px]"><p className="font-medium truncate">{p.title}</p></td>
                  <td className="px-4 py-3 text-gray-400">{p.vendor || '—'}</td>
                  <td className="px-4 py-3">
                    {editingPrice === p.id ? (
                      <div className="flex items-center gap-1">
                        <input type="number" value={editPriceVal} onChange={e => setEditPriceVal(e.target.value)} className="input-dark w-24 text-xs py-1 px-2" autoFocus onKeyDown={e => e.key === 'Enter' && savePriceInline(p.id)} />
                        <button onClick={() => savePriceInline(p.id)} className="text-green-400 hover:text-green-300"><Check size={14} /></button>
                        <button onClick={() => setEditingPrice(null)} className="text-gray-500 hover:text-red-400"><X size={14} /></button>
                      </div>
                    ) : (
                      <span className="cursor-pointer hover:text-gold transition-colors" onClick={() => { setEditingPrice(p.id); setEditPriceVal(String(p.selling_price)); }}>{formatKES(p.selling_price)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{p.buying_price ? formatKES(p.buying_price) : '—'}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs capitalize ${p.status === 'active' ? 'bg-green-500/20 text-green-400' : p.status === 'draft' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-400'}`}>{p.status}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(p)} className="p-1.5 hover:text-gold transition-colors"><Edit2 size={15} /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 hover:text-red-400 transition-colors"><Trash2 size={15} /></button>
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

      {/* Add/Edit Modal */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editProduct ? 'Edit Product' : 'Add Product'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <ProductFormFields f={form} setF={setForm} />
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-gold px-6 py-2.5 font-semibold text-sm flex items-center gap-2">
              {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : 'Save Product'}
            </button>
            <button type="button" onClick={() => setFormOpen(false)} className="btn-outline-gold px-6 py-2.5 text-sm">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* CSV Import Modal */}
      <Modal open={importOpen} onClose={() => setImportOpen(false)} title="Import Products from CSV" size="md">
        <div className="space-y-4">
          <p className="text-sm text-gray-400">Upload a Shopify-format CSV file to bulk import products.</p>
          <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${importFile ? 'border-gold/50 bg-gold/5' : 'border-[#333] hover:border-gold/30'}`}>
            <input {...getInputProps()} />
            {importFile ? (
              <div><p className="text-gold font-medium">{importFile.name}</p><p className="text-gray-400 text-sm mt-1">{(importFile.size / 1024).toFixed(1)} KB</p></div>
            ) : (
              <div><Upload size={32} className="mx-auto text-gray-500 mb-3" /><p className="text-gray-300 text-sm">Drop CSV file here or click to choose</p><p className="text-gray-500 text-xs mt-1">Shopify product export format supported</p></div>
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

      {/* URL Import Modal */}
      <Modal open={urlImportOpen} onClose={() => { setUrlImportOpen(false); setUrlImportStep('input'); }} title={urlImportStep === 'input' ? 'Import Product from URL' : 'Review Extracted Product'} size="lg">
        {urlImportStep === 'input' ? (
          <div className="space-y-5">
            <div className="bg-[#0D0D0D] rounded-xl p-4 text-sm text-gray-400 space-y-1">
              <p className="text-gray-300 font-medium mb-2">Supported platforms</p>
              <p>• Amazon — paste any product page URL</p>
              <p>• AliExpress — direct product listing URL</p>
              <p>• Alibaba — supplier product page URL</p>
              <p className="text-yellow-400/70 text-xs mt-2">Note: some sites use bot protection. If extraction fails, you can fill details manually using Add Product.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Product URL</label>
              <input
                type="url"
                value={importUrl}
                onChange={e => setImportUrl(e.target.value)}
                placeholder="https://www.amazon.com/product/..."
                className="input-dark text-sm w-full"
                onKeyDown={e => e.key === 'Enter' && handleExtractUrl()}
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button onClick={handleExtractUrl} disabled={!importUrl.trim() || extracting} className="btn-gold flex-1 py-2.5 text-sm font-semibold flex items-center justify-center gap-2">
                {extracting ? <><Loader2 size={16} className="animate-spin" /> Extracting...</> : <><Link2 size={16} /> Extract Product</>}
              </button>
              <button onClick={() => setUrlImportOpen(false)} className="btn-outline-gold px-4 py-2.5 text-sm">Cancel</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveUrlProduct} className="space-y-4">
            {urlImages.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-300 mb-2">Extracted Images ({urlImages.length})</p>
                <div className="flex gap-2 flex-wrap">
                  {urlImages.slice(0, 4).map((img, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-lg bg-[#1A1A1A] overflow-hidden border border-[#333]">
                      <Image src={img.src} alt="" fill className="object-cover" sizes="64px" onError={() => setUrlImages(prev => prev.filter((_, j) => j !== i))} />
                    </div>
                  ))}
                  {urlImages.length > 4 && <div className="w-16 h-16 rounded-lg bg-[#1A1A1A] border border-[#333] flex items-center justify-center text-gray-400 text-xs">+{urlImages.length - 4}</div>}
                </div>
              </div>
            )}
            <ProductFormFields f={urlForm} setF={setUrlForm} />
            <p className="text-xs text-gray-500">This product will be saved as a draft. Review and set to active when ready.</p>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setUrlImportStep('input')} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors">
                <ArrowLeft size={16} /> Back
              </button>
              <button type="submit" disabled={saving} className="btn-gold px-6 py-2.5 font-semibold text-sm flex items-center gap-2 ml-auto">
                {saving ? <><Loader2 size={16} className="animate-spin" /> Importing...</> : 'Import Product'}
              </button>
              <button type="button" onClick={() => setUrlImportOpen(false)} className="btn-outline-gold px-4 py-2.5 text-sm">Cancel</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
