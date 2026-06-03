"use client";

import React, { useState } from 'react';
import { createProduct, updateProduct, deleteProduct } from '@/app/admin/actions';
import { formatINR, convertFromBaseUnit, BASE_UNITS, DIMENSION_UNITS } from '@/lib/conversions';
import { Search, Plus, Edit, Trash2, X, AlertTriangle } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  dimensionType: 'WEIGHT' | 'VOLUME' | 'COUNT';
  totalQuantity: string;
  pricePerBaseUnit: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export function ProductManager({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [dimensionType, setDimensionType] = useState<'WEIGHT' | 'VOLUME' | 'COUNT'>('WEIGHT');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState<'g' | 'kg' | 'mL' | 'L' | 'items'>('kg');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle opening modal for creating
  const openCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setSku('');
    setDescription('');
    setDimensionType('WEIGHT');
    setQuantity('');
    setPrice('');
    setUnit('kg');
    setError('');
    setIsOpen(true);
  };

  // Handle opening modal for editing
  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setSku(product.sku);
    setDescription(product.description || '');
    setDimensionType(product.dimensionType);
    
    // We display in the base unit for editing to preserve exact DB values
    const baseUnit = BASE_UNITS[product.dimensionType];
    setQuantity(parseFloat(product.totalQuantity).toString());
    setPrice(parseFloat(product.pricePerBaseUnit).toString());
    setUnit(baseUnit);
    setError('');
    setIsOpen(true);
  };

  // Sync unit list when dimension changes
  const handleDimensionChange = (val: 'WEIGHT' | 'VOLUME' | 'COUNT') => {
    setDimensionType(val);
    const defaultUnit = val === 'WEIGHT' ? 'kg' : val === 'VOLUME' ? 'L' : 'items';
    setUnit(defaultUnit);
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload = {
      name,
      sku,
      description,
      dimensionType,
      totalQuantity: parseFloat(quantity),
      pricePerBaseUnit: parseFloat(price),
      unit,
    };

    let result;
    if (editingProduct) {
      result = await updateProduct(editingProduct.id, payload);
    } else {
      result = await createProduct(payload);
    }

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      // Re-fetch products logic / local state update
      // For a quick experience, we can reload the window or update state
      // Since it is a Server Action and we call revalidatePath, reloading is simplest
      window.location.reload();
    }
  };

  // Delete product
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    const result = await deleteProduct(id);
    if (result.error) {
      alert(result.error);
    } else {
      window.location.reload();
    }
  };

  // Filter products by search query
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search & Actions Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:border-zinc-800 dark:bg-zinc-900 transition dark:text-zinc-50"
          />
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      {/* Products Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/50 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/30 dark:text-zinc-400">
                <th className="px-6 py-4">Product Details</th>
                <th className="px-6 py-4">Dimension</th>
                <th className="px-6 py-4">Current Stock</th>
                <th className="px-6 py-4">Base Price</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400">
                    No products found. Add a new product to get started.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const baseUnit = BASE_UNITS[product.dimensionType];
                  const qVal = parseFloat(product.totalQuantity);
                  const pVal = parseFloat(product.pricePerBaseUnit);
                  const isLowStock = qVal < 1000;

                  return (
                    <tr key={product.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition text-zinc-950 dark:text-zinc-200">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-50">{product.name}</div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">SKU: {product.sku}</div>
                        {product.description && (
                          <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 line-clamp-1">{product.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                          {product.dimensionType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <span>
                            {product.dimensionType === 'WEIGHT' && qVal >= 1000 
                              ? `${convertFromBaseUnit(qVal, 'kg')} kg`
                              : product.dimensionType === 'VOLUME' && qVal >= 1000
                              ? `${convertFromBaseUnit(qVal, 'L')} L`
                              : `${qVal} ${baseUnit}`}
                          </span>
                          {isLowStock && (
                            <span className="text-amber-600 dark:text-amber-400" title="Low stock alert">
                              <AlertTriangle className="h-4.5 w-4.5" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>{formatINR(pVal)}/{baseUnit}</div>
                        {baseUnit !== 'items' && (
                          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            {baseUnit === 'g' ? `(${formatINR(pVal * 1000)}/kg)` : `(${formatINR(pVal * 1000)}/L)`}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(product)}
                            className="p-1.5 text-zinc-500 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition cursor-pointer"
                            title="Edit product"
                          >
                            <Edit className="h-4.5 w-4.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-1.5 text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition cursor-pointer"
                            title="Delete product"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 px-6 py-4">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-400 flex items-center gap-2">
                  <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                  Product Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paracetamol Raw Powder"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:border-zinc-800 transition dark:text-zinc-50 text-sm"
                />
              </div>

              {/* SKU */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                  SKU Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PCM-POWDER-01"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:border-zinc-800 transition dark:text-zinc-50 text-sm"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  placeholder="e.g. Pharmaceutical grade active substance"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:border-zinc-800 transition dark:text-zinc-50 text-sm h-20 resize-none"
                />
              </div>

              {/* Dimension Type & Unit selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                    Dimension
                  </label>
                  <select
                    value={dimensionType}
                    onChange={(e) => handleDimensionChange(e.target.value as any)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:border-zinc-800 transition dark:text-zinc-50 text-sm cursor-pointer"
                  >
                    <option value="WEIGHT">Weight</option>
                    <option value="VOLUME">Volume</option>
                    <option value="COUNT">Count</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                    Input Unit
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as any)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:border-zinc-800 transition dark:text-zinc-50 text-sm cursor-pointer"
                  >
                    {DIMENSION_UNITS[dimensionType].map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quantity & Price selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                    Quantity ({unit})
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 50"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:border-zinc-800 transition dark:text-zinc-50 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                    Price (INR/{unit})
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 120"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:border-zinc-800 transition dark:text-zinc-50 text-sm"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 bg-transparent text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition cursor-pointer dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold text-white shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default ProductManager;
