"use client";

import React, { useState } from 'react';
import { placeOrder } from '@/app/dashboard/actions';
import { formatINR, convertToBaseUnit, BASE_UNITS, DIMENSION_UNITS, convertFromBaseUnit, calculatePriceForDisplayUnit } from '@/lib/conversions';
import { Search, ShoppingCart, Trash2, ArrowRight, CheckCircle2, AlertTriangle, Package } from 'lucide-react';

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

interface CartItem {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  unit: 'g' | 'kg' | 'mL' | 'L' | 'items';
  pricePerUnit: number;
  cost: number;
}

export function SellerDashboard({ initialProducts }: { initialProducts: Product[] }) {
  const [products] = useState<Product[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDimension, setSelectedDimension] = useState<string>('ALL');
  
  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  // Per-product inputs state
  const [productInputs, setProductInputs] = useState<Record<string, { quantity: string; unit: 'g' | 'kg' | 'mL' | 'L' | 'items' }>>({});

  // Get current inputs for a product
  const getInputState = (product: Product) => {
    const defaultUnit = product.dimensionType === 'WEIGHT' ? 'kg' : product.dimensionType === 'VOLUME' ? 'L' : 'items';
    return productInputs[product.id] || { quantity: '', unit: defaultUnit };
  };

  const handleInputChange = (productId: string, field: 'quantity' | 'unit', value: string) => {
    setProductInputs(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId] || { quantity: '', unit: 'items' },
        [field]: value
      }
    }));
  };

  const addToCart = (product: Product) => {
    const input = getInputState(product);
    const qty = parseFloat(input.quantity);
    if (isNaN(qty) || qty <= 0) {
      alert('Please enter a valid quantity.');
      return;
    }

    // Check against local stock
    const requestedBaseQty = convertToBaseUnit(qty, input.unit);
    const availableBaseQty = parseFloat(product.totalQuantity);
    if (requestedBaseQty > availableBaseQty) {
      alert(`Insufficient stock. Available: ${
        product.dimensionType === 'WEIGHT' && availableBaseQty >= 1000 ? `${convertFromBaseUnit(availableBaseQty, 'kg')} kg` :
        product.dimensionType === 'VOLUME' && availableBaseQty >= 1000 ? `${convertFromBaseUnit(availableBaseQty, 'L')} L` :
        `${availableBaseQty} ${BASE_UNITS[product.dimensionType]}`
      }`);
      return;
    }

    const pricePerBase = parseFloat(product.pricePerBaseUnit);
    const pricePerSelectedUnit = calculatePriceForDisplayUnit(pricePerBase, input.unit);
    const cost = qty * pricePerSelectedUnit;

    const existingIndex = cart.findIndex(item => item.productId === product.id && item.unit === input.unit);
    if (existingIndex > -1) {
      const updatedCart = [...cart];
      const newQty = updatedCart[existingIndex].quantity + qty;
      const newBaseQty = convertToBaseUnit(newQty, input.unit);
      if (newBaseQty > availableBaseQty) {
        alert('Cannot add more of this item. Exceeds total available stock.');
        return;
      }
      updatedCart[existingIndex].quantity = newQty;
      updatedCart[existingIndex].cost = newQty * pricePerSelectedUnit;
      setCart(updatedCart);
    } else {
      setCart(prev => [...prev, {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        quantity: qty,
        unit: input.unit,
        pricePerUnit: pricePerSelectedUnit,
        cost
      }]);
    }

    // Reset input
    handleInputChange(product.id, 'quantity', '');
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    setError('');
    setOrderSuccess(null);

    const payload = {
      items: cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unit: item.unit
      }))
    };

    const result = await placeOrder(payload);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setOrderSuccess(result.orderId || 'Order placed');
      setCart([]);
      setLoading(false);
      // Refresh database quantities by reloading page
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  };

  const cartTotal = cart.reduce((acc, item) => acc + item.cost, 0);

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDimension = selectedDimension === 'ALL' || p.dimensionType === selectedDimension;
    return matchesSearch && matchesDimension;
  });

  return (
    <div className="space-y-6">
      {orderSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-450 flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-emerald-450 shrink-0" />
          <div>
            <p className="font-bold text-white">Order Placed Successfully!</p>
            <p className="text-xs mt-0.5">Order ID: #{orderSuccess.slice(0, 8)}. Reloading inventory...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-450 flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-rose-455 shrink-0" />
          <div>
            <p className="font-bold text-white">Checkout Failed</p>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Catalog Grid */}
        <div className="lg:col-span-2 space-y-6">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#141417] border border-[#1f1f23] rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-500 transition text-zinc-200 text-xs"
              />
            </div>
            
            <div className="flex gap-2">
              {['ALL', 'WEIGHT', 'VOLUME', 'COUNT'].map((dim) => (
                <button
                  key={dim}
                  onClick={() => setSelectedDimension(dim)}
                  className={`px-3 py-2 text-[10px] font-bold rounded-xl border transition cursor-pointer ${
                    selectedDimension === dim
                      ? 'bg-white border-white text-black font-extrabold shadow-md'
                      : 'bg-[#141417] border-[#1f1f23] text-zinc-400 hover:text-white'
                  }`}
                >
                  {dim}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 border border-dashed border-[#1f1f23] rounded-2xl bg-[#09090b] text-zinc-500">
              <Package className="h-10 w-10 mb-2 opacity-55 text-zinc-650" />
              <p className="text-xs">No products available matching filters.</p>
            </div>
          ) : (
            <div className="grid gap-4.5 sm:grid-cols-2">
              {filteredProducts.map((product) => {
                const baseUnit = BASE_UNITS[product.dimensionType];
                const availableBase = parseFloat(product.totalQuantity);
                const pricePerBase = parseFloat(product.pricePerBaseUnit);
                const inputState = getInputState(product);
                
                // Calculate display price for current selected unit
                const displayPrice = calculatePriceForDisplayUnit(pricePerBase, inputState.unit);

                const isOutOfStock = availableBase <= 0;

                return (
                  <div
                    key={product.id}
                    className={`group relative overflow-hidden rounded-2xl border bg-[#09090b] p-5 transition flex flex-col justify-between ${
                      isOutOfStock
                        ? 'border-[#1f1f23] opacity-60'
                        : 'border-[#1f1f23] hover:border-zinc-500/50 hover:shadow-md'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-white group-hover:text-white transition text-sm">
                            {product.name}
                          </h4>
                          <p className="text-[10px] text-zinc-500 mt-0.5">SKU: {product.sku}</p>
                        </div>
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold bg-[#141417] text-zinc-400 border border-[#1f1f23]">
                          {product.dimensionType}
                        </span>
                      </div>

                      {product.description && (
                        <p className="text-[11px] text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                          {product.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-5 space-y-4">
                      {/* Pricing and Stock Info */}
                      <div className="flex items-baseline justify-between border-t border-[#1f1f23] pt-3">
                        <div className="text-[10px] text-zinc-500">
                          Stock:{' '}
                          <span className="font-bold text-zinc-300">
                            {product.dimensionType === 'WEIGHT' && availableBase >= 1000
                              ? `${convertFromBaseUnit(availableBase, 'kg')} kg`
                              : product.dimensionType === 'VOLUME' && availableBase >= 1000
                              ? `${convertFromBaseUnit(availableBase, 'L')} L`
                              : `${availableBase} ${baseUnit}`}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-extrabold text-white">
                            {formatINR(displayPrice)}
                          </span>
                          <span className="text-[10px] text-zinc-500">/{inputState.unit}</span>
                        </div>
                      </div>

                      {/* Order Controls */}
                      {!isOutOfStock && (
                        <div className="flex items-center gap-2">
                          <div className="flex rounded-xl border border-[#1f1f23] bg-[#141417] overflow-hidden flex-1">
                            <input
                              type="number"
                              step="any"
                              placeholder="Qty"
                              value={inputState.quantity}
                              onChange={(e) => handleInputChange(product.id, 'quantity', e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-transparent focus:outline-none text-xs text-white"
                            />
                            {DIMENSION_UNITS[product.dimensionType].length > 1 ? (
                              <select
                                value={inputState.unit}
                                onChange={(e) => handleInputChange(product.id, 'unit', e.target.value)}
                                className="border-l border-[#1f1f23] bg-zinc-900 px-2 text-[10px] font-bold text-zinc-305 focus:outline-none cursor-pointer"
                              >
                                {DIMENSION_UNITS[product.dimensionType].map((u) => (
                                  <option key={u} value={u}>{u}</option>
                                ))}
                              </select>
                            ) : (
                              <span className="flex items-center justify-center bg-zinc-905 px-3 text-[10px] font-bold text-zinc-400 border-l border-[#1f1f23]">
                                {baseUnit}
                              </span>
                            )}
                          </div>
                          
                          <button
                            onClick={() => addToCart(product)}
                            className="bg-white hover:bg-zinc-200 text-black rounded-xl px-3 py-1.5 text-[10px] font-bold transition cursor-pointer"
                          >
                            Add
                          </button>
                        </div>
                      )}

                      {isOutOfStock && (
                        <div className="text-center py-1.5 bg-[#141417] text-zinc-500 rounded-xl text-[10px] font-bold border border-[#1f1f23]">
                          Out of Stock
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Shopping Cart Sidebar */}
        <div className="relative">
          <div className="sticky top-20 rounded-2xl border border-[#1f1f23] bg-[#09090b] p-5 flex flex-col min-h-[400px] justify-between shadow-lg shadow-black/40">
            <div>
              <div className="flex items-center justify-between border-b border-[#1f1f23] pb-3 mb-4.5">
                <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <ShoppingCart className="h-4.5 w-4.5 text-zinc-300" />
                  Order Cart
                </h3>
                <span className="rounded-full bg-zinc-800 border border-zinc-700 px-2 py-0.5 text-[10px] font-bold text-zinc-300">
                  {cart.length}
                </span>
              </div>

              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                  <ShoppingCart className="h-8 w-8 mb-2 opacity-50 text-zinc-650" />
                  <p className="text-xs">Your cart is empty.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {cart.map((item, idx) => (
                    <div key={`${item.productId}-${item.unit}`} className="flex items-center justify-between py-2 border-b border-[#1f1f23]/50">
                      <div>
                        <p className="font-semibold text-xs text-white line-clamp-1">{item.name}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                          {item.quantity} {item.unit} @ {formatINR(item.pricePerUnit)}/{item.unit}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-xs text-white">{formatINR(item.cost)}</span>
                        <button
                          onClick={() => removeFromCart(idx)}
                          className="text-zinc-500 hover:text-rose-500 transition cursor-pointer p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-[#1f1f23] pt-4 mt-4 space-y-4">
              <div className="flex items-baseline justify-between">
                <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Total Amount</span>
                <span className="text-lg font-extrabold text-white">{formatINR(cartTotal)}</span>
              </div>

              <button
                onClick={handleCheckout}
                disabled={cart.length === 0 || loading}
                className="w-full flex items-center justify-center gap-1.5 bg-white hover:bg-zinc-200 disabled:bg-[#141417] disabled:border-[#1f1f23] disabled:text-zinc-600 text-black rounded-xl py-2.5 text-xs font-bold transition cursor-pointer disabled:cursor-not-allowed shadow-md"
              >
                {loading ? 'Processing Order...' : 'Place Order'}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default SellerDashboard;
