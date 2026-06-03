"use client";

import React, { useState } from 'react';
import { createProduct, updateProduct, deleteProduct } from '@/app/admin/actions';
import { formatINR, convertFromBaseUnit, BASE_UNITS } from '@/lib/conversions';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  ArrowLeft, 
  Sparkles, 
  Check, 
  Info,
  Pill,
  Compass,
  FileText
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  dimensionType: 'WEIGHT' | 'VOLUME' | 'COUNT';
  totalQuantity: string;
  pricePerBaseUnit: string;
  
  category?: string | null;
  manufacturer?: string | null;
  strength?: string | null;
  packSize?: string | null;
  baseUnit?: string | null;
  wholesalePrice?: string | null;
  gstRate?: string | null;
  maxDiscount?: string | null;
  lowStockThreshold?: string | null;
  status?: string | null;
  prescriptionRequired?: boolean | null;
  controlledSubstance?: boolean | null;
  coldChainRequired?: boolean | null;
  hsnCode?: string | null;
  drugSchedule?: string | null;
  trackExpiry?: boolean | null;

  createdAt: Date | null;
  updatedAt: Date | null;
}

export function ProductManager({ initialProducts }: { initialProducts: Product[] }) {
  const [products] = useState<Product[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [dimensionType, setDimensionType] = useState<'WEIGHT' | 'VOLUME' | 'COUNT'>('COUNT');
  
  // Custom Visual Dimension Form Selection
  // Buttons: Tablets, Capsules, Syrup, Injection, Cream/Ointment, Drops, Powder, Patch
  const [subType, setSubType] = useState<string>('Tablets');
  const [packSize, setPackSize] = useState('10');
  const [strength, setStrength] = useState('');
  
  const [category, setCategory] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  
  // Quantities & Prices
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [wholesalePrice, setWholesalePrice] = useState('');
  const [gstRate, setGstRate] = useState('12');
  const [maxDiscount, setMaxDiscount] = useState('10');
  const [lowStockThreshold, setLowStockThreshold] = useState('50');

  // Sidebar Controls
  const [productStatus, setProductStatus] = useState('Active');
  const [prescriptionRequired, setPrescriptionRequired] = useState(false);
  const [controlledSubstance, setControlledSubstance] = useState(false);
  const [coldChainRequired, setColdChainRequired] = useState(false);
  const [hsnCode, setHsnCode] = useState('');
  const [drugSchedule, setDrugSchedule] = useState('None / OTC');
  const [trackExpiry, setTrackExpiry] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');

  // Auto-fill Readonly Base Unit based on dimension type and SubType selection
  const getBaseUnitLabel = () => {
    if (subType === 'Tablets' || subType === 'Capsules' || subType === 'Patch') {
      return 'Strip / Pack';
    }
    if (subType === 'Syrup' || subType === 'Drops') {
      return 'Bottle';
    }
    if (subType === 'Injection') {
      return 'Vial';
    }
    if (subType === 'Cream/Ointment') {
      return 'Tube';
    }
    return 'Pack';
  };

  // Synchronize baseUnit when subType changes
  const baseUnitVal = getBaseUnitLabel();

  // Mapping subType to main DB dimension type
  const updateDimensionTypeBySubType = (st: string) => {
    setSubType(st);
    if (st === 'Tablets' || st === 'Capsules' || st === 'Patch') {
      setDimensionType('COUNT');
    } else if (st === 'Syrup' || st === 'Injection' || st === 'Drops') {
      setDimensionType('VOLUME');
    } else {
      setDimensionType('WEIGHT');
    }
  };

  // Auto Generate SKU Code
  const handleAutoGenerateSKU = () => {
    if (!name) {
      alert('Please enter a product name first.');
      return;
    }
    const cleanName = name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
    const cleanStrength = strength ? strength.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) : 'RAW';
    const cleanType = subType.toUpperCase().slice(0, 3);
    const rand = Math.floor(100 + Math.random() * 900);
    setSku(`${cleanName}-${cleanStrength}-${cleanType}-${rand}`);
  };

  // Checklist Completion calculation
  const checklist = [
    { label: 'Product Name', completed: name.trim().length > 0 },
    { label: 'SKU', completed: sku.trim().length > 0 },
    { label: 'Category', completed: category.trim().length > 0 },
    { label: 'Description', completed: description.trim().length > 0 },
    { label: 'Base Price', completed: parseFloat(price) > 0 },
    { label: 'Initial Stock', completed: parseFloat(quantity) > 0 },
  ];
  const completedCount = checklist.filter(c => c.completed).length;
  const progressPercent = Math.round((completedCount / checklist.length) * 100);

  // Switch/Form Toggle Handlers
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setName('');
    setSku('');
    setDescription('');
    setDimensionType('COUNT');
    setSubType('Tablets');
    setPackSize('10');
    setStrength('');
    setCategory('');
    setManufacturer('');
    setQuantity('');
    setPrice('');
    setWholesalePrice('');
    setGstRate('12');
    setMaxDiscount('10');
    setLowStockThreshold('50');
    setProductStatus('Active');
    setPrescriptionRequired(false);
    setControlledSubstance(false);
    setColdChainRequired(false);
    setHsnCode('');
    setDrugSchedule('None / OTC');
    setTrackExpiry(false);
    setError('');
    setWarning('');
    setView('form');
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setSku(p.sku);
    setDescription(p.description || '');
    setDimensionType(p.dimensionType);
    
    // Guess subType from metadata or type
    if (p.dimensionType === 'COUNT') {
      setSubType(p.category?.includes('Capsule') ? 'Capsules' : 'Tablets');
    } else if (p.dimensionType === 'VOLUME') {
      setSubType(p.category?.includes('Injection') ? 'Injection' : 'Syrup');
    } else {
      setSubType('Powder');
    }

    setPackSize(p.packSize ? parseFloat(p.packSize).toString() : '10');
    setStrength(p.strength || '');
    setCategory(p.category || '');
    setManufacturer(p.manufacturer || '');

    setQuantity(parseFloat(p.totalQuantity).toString());
    setPrice(parseFloat(p.pricePerBaseUnit).toString());
    
    setWholesalePrice(p.wholesalePrice ? parseFloat(p.wholesalePrice).toString() : '');
    setGstRate(p.gstRate ? parseFloat(p.gstRate).toString() : '12');
    setMaxDiscount(p.maxDiscount ? parseFloat(p.maxDiscount).toString() : '10');
    setLowStockThreshold(p.lowStockThreshold ? parseFloat(p.lowStockThreshold).toString() : '50');
    setProductStatus(p.status || 'Active');
    setPrescriptionRequired(!!p.prescriptionRequired);
    setControlledSubstance(!!p.controlledSubstance);
    setColdChainRequired(!!p.coldChainRequired);
    setHsnCode(p.hsnCode || '');
    setDrugSchedule(p.drugSchedule || 'None / OTC');
    setTrackExpiry(!!p.trackExpiry);
    setError('');
    setWarning('');
    setView('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setWarning('');

    const gstRateValue = parseFloat(gstRate);
    const discountValue = parseFloat(maxDiscount);

    if (Number.isNaN(gstRateValue) || gstRateValue < 0 || gstRateValue > 100) {
      setWarning('GST rate must be between 0 and 100.');
      setLoading(false);
      return;
    }

    if (Number.isNaN(discountValue) || discountValue < 0 || discountValue > 100) {
      setWarning('Discount percentage must be between 0 and 100.');
      setLoading(false);
      return;
    }

    // Mapping inputs to match database conventions
    const baseUnit = BASE_UNITS[dimensionType];

    const payload = {
      name,
      sku,
      description,
      dimensionType,
      totalQuantity: parseFloat(quantity),
      pricePerBaseUnit: parseFloat(price),
      unit: baseUnit,
      
      category,
      manufacturer,
      strength,
      packSize: parseFloat(packSize),
      baseUnit: baseUnitVal,
      wholesalePrice: parseFloat(wholesalePrice || '0'),
      gstRate: gstRateValue,
      maxDiscount: discountValue,
      lowStockThreshold: parseFloat(lowStockThreshold),
      status: productStatus,
      prescriptionRequired,
      controlledSubstance,
      coldChainRequired,
      hsnCode,
      drugSchedule,
      trackExpiry,
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
      window.location.reload();
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    const result = await deleteProduct(id);
    if (result.error) {
      alert(result.error);
    } else {
      window.location.reload();
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (view === 'form') {
    return (
      <div className="space-y-6 text-xs max-w-6xl mx-auto">
        {/* Form Header with Breadcrumb and Back Arrow */}
        <div className="flex items-center gap-4 pb-2 border-b border-[#1f1f23]">
          <button
            onClick={() => setView('list')}
            className="p-2 rounded-xl border border-[#1f1f23] bg-[#141417] text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </button>
          
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white tracking-tight">
                {editingProduct ? 'Edit Product Details' : 'Add New Product'}
              </h2>
              <span className="inline-flex items-center rounded bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 text-[9px] font-bold text-zinc-300">
                New
              </span>
            </div>
            <p className="text-[10px] text-zinc-550 mt-1">Fill in the details below to add a new pharmaceutical product to the catalogue.</p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-450 font-bold flex items-center gap-2">
            <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {warning && (
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 font-bold flex items-center gap-2">
            <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
            <span>{warning}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (Forms & Details) - Span 2 */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card 1: Basic Information */}
            <div className="rounded-2xl border border-[#1f1f23] bg-[#09090b] p-6 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-[#1f1f23]">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400">
                  <Compass className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white">Basic Information</h3>
                  <p className="text-[9px] text-zinc-550 leading-none mt-0.5">Product identity and classification</p>
                </div>
              </div>

              {/* Product Name */}
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amoxicillin 500mg Capsules"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#141417] border border-[#1f1f23] rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-500 text-zinc-200 text-xs"
                />
                <span className="text-[9px] text-zinc-550 mt-1 block">Enter the full product name including strength and form.</span>
              </div>

              {/* SKU */}
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">
                  SKU *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. AMX-500-CAP"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full pl-3.5 pr-20 py-2.5 bg-[#141417] border border-[#1f1f23] rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-500 text-zinc-200 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAutoGenerateSKU}
                    className="absolute right-2 top-1.5 px-3 py-1 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-350 hover:text-white transition text-[9px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Auto</span>
                  </button>
                </div>
                <span className="text-[9px] text-zinc-550 mt-1 block">Unique stock-keeping unit identifier. Use uppercase letters and hyphens.</span>
              </div>

              {/* Category & Manufacturer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-[#141417] border border-[#1f1f23] rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-500 text-zinc-200 text-xs cursor-pointer"
                  >
                    <option value="">Select category...</option>
                    <option value="Antibiotics">Antibiotics</option>
                    <option value="Analgesics">Analgesics</option>
                    <option value="Antivirals">Antivirals</option>
                    <option value="Cardiovascular">Cardiovascular</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="Vitamins/Supplements">Vitamins/Supplements</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">
                    Manufacturer
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Cipla Ltd."
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#141417] border border-[#1f1f23] rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-500 text-zinc-200 text-xs"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500">
                    Description *
                  </label>
                  <span className="text-[9px] text-zinc-550">{description.length}/500</span>
                </div>
                <textarea
                  required
                  placeholder="Describe the product, its uses, active ingredients, and any important notes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                  className="w-full px-3.5 py-2.5 bg-[#141417] border border-[#1f1f23] rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-500 text-zinc-200 text-xs h-24 resize-none"
                />
              </div>
            </div>

            {/* Card 2: Dimension & Packaging */}
            <div className="rounded-2xl border border-[#1f1f23] bg-[#09090b] p-6 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-[#1f1f23]">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400">
                  <Pill className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white">Dimension & Packaging</h3>
                  <p className="text-[9px] text-zinc-550 leading-none mt-0.5">Product form, packaging type, and base unit</p>
                </div>
              </div>

              {/* Visual SubType Buttons */}
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
                  Dimension Type *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    'Tablets',
                    'Capsules',
                    'Syrup',
                    'Injection',
                    'Cream/Ointment',
                    'Drops',
                    'Powder',
                    'Patch',
                  ].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => updateDimensionTypeBySubType(st)}
                      className={`py-2 px-3.5 rounded-xl border text-[10px] font-bold text-center transition cursor-pointer ${
                        subType === st
                          ? 'bg-white border-white text-black font-extrabold'
                          : 'bg-[#141417] border-[#1f1f23] text-zinc-450 hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pack Size, Base Unit & Strength */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">
                    Pack Size *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="10"
                    value={packSize}
                    onChange={(e) => setPackSize(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#141417] border border-[#1f1f23] rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-500 text-zinc-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">
                    Base Unit <span className="text-[8px] text-zinc-550">(Read-only)</span>
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={baseUnitVal}
                    className="w-full px-3.5 py-2.5 bg-[#1f1f23] border border-[#27272a] rounded-xl text-zinc-450 text-xs font-semibold select-none focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">
                    Strength / Concentration
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 500mg, 0.1%"
                    value={strength}
                    onChange={(e) => setStrength(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#141417] border border-[#1f1f23] rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-500 text-zinc-200 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Card 3: Pricing & Initial Stock */}
            <div className="rounded-2xl border border-[#1f1f23] bg-[#09090b] p-6 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-[#1f1f23]">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white">Pricing & Initial Stock</h3>
                  <p className="text-[9px] text-zinc-550 leading-none mt-0.5">Set base price and opening inventory quantity</p>
                </div>
              </div>

              {/* MRP & Wholesale Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">
                    Base Price (MRP) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    placeholder="₹ 0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#141417] border border-[#1f1f23] rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-500 text-zinc-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">
                    Wholesale Price
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="₹ 0.00"
                    value={wholesalePrice}
                    onChange={(e) => setWholesalePrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#141417] border border-[#1f1f23] rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-500 text-zinc-200 text-xs"
                  />
                </div>
              </div>

              {/* GST Slab & Max Discount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">
                    GST Rate (%)
                  </label>
                  <select
                    value={gstRate}
                    onChange={(e) => setGstRate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#141417] border border-[#1f1f23] rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-500 text-zinc-200 text-xs cursor-pointer"
                  >
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                  </select>
                  <span className="mt-1 block text-[9px] text-zinc-550">Allowed range: 0% to 100%.</span>
                </div>

                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">
                    Max Discount (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="10"
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#141417] border border-[#1f1f23] rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-500 text-zinc-200 text-xs"
                  />
                  <span className="mt-1 block text-[9px] text-zinc-550">Allowed range: 0% to 100%.</span>
                </div>
              </div>

              {/* Initial Stock & Low Stock alert threshold */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">
                    Initial Stock Quantity *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="e.g. 100"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#141417] border border-[#1f1f23] rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-500 text-zinc-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">
                    Low Stock Alert Threshold
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="50"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#141417] border border-[#1f1f23] rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-500 text-zinc-200 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (Sidebar Cards) */}
          <div className="space-y-6">
            {/* Status & Visibility */}
            <div className="rounded-2xl border border-[#1f1f23] bg-[#09090b] p-6 space-y-4">
              <h3 className="font-extrabold text-white border-b border-[#1f1f23] pb-2">Status & Visibility</h3>
              
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">
                  Product Status
                </label>
                <select
                  value={productStatus}
                  onChange={(e) => setProductStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-[#141417] border border-[#1f1f23] rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-500 text-zinc-200 cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Draft">Draft</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>

              {/* Switches */}
              <div className="space-y-3 pt-2">
                {/* Rx-Only Prescription */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white text-[11px]">Prescription Required</p>
                    <p className="text-[9px] text-zinc-550">Mark as Rx-only medicine</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={prescriptionRequired} 
                      onChange={(e) => setPrescriptionRequired(e.target.checked)} 
                      className="sr-only peer" 
                    />
                    <div className="w-8 h-4.5 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-white"></div>
                  </label>
                </div>

                {/* Controlled Substance */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white text-[11px]">Controlled Substance</p>
                    <p className="text-[9px] text-zinc-550">Schedule H / Narcotic drug</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={controlledSubstance} 
                      onChange={(e) => setControlledSubstance(e.target.checked)} 
                      className="sr-only peer" 
                    />
                    <div className="w-8 h-4.5 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-white"></div>
                  </label>
                </div>

                {/* Cold Chain Required */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white text-[11px]">Cold Chain Required</p>
                    <p className="text-[9px] text-zinc-550">Needs refrigeration (2-8°C)</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={coldChainRequired} 
                      onChange={(e) => setColdChainRequired(e.target.checked)} 
                      className="sr-only peer" 
                    />
                    <div className="w-8 h-4.5 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-white"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Regulatory Info */}
            <div className="rounded-2xl border border-[#1f1f23] bg-[#09090b] p-6 space-y-4">
              <h3 className="font-extrabold text-white border-b border-[#1f1f23] pb-2">Regulatory Info</h3>
              
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">
                  HSN Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. 30049099"
                  value={hsnCode}
                  onChange={(e) => setHsnCode(e.target.value)}
                  className="w-full px-3 py-2 bg-[#141417] border border-[#1f1f23] rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-500 text-zinc-200"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">
                  Drug Schedule
                </label>
                <select
                  value={drugSchedule}
                  onChange={(e) => setDrugSchedule(e.target.value)}
                  className="w-full px-3 py-2 bg-[#141417] border border-[#1f1f23] rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-500 text-zinc-200 cursor-pointer"
                >
                  <option value="None / OTC">None / OTC</option>
                  <option value="Schedule H">Schedule H</option>
                  <option value="Schedule G">Schedule G</option>
                  <option value="Schedule X">Schedule X</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="font-bold text-white text-[11px]">Track Expiry Dates</p>
                  <p className="text-[9px] text-zinc-550">Enable batch expiry tracking</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={trackExpiry} 
                    onChange={(e) => setTrackExpiry(e.target.checked)} 
                    className="sr-only peer" 
                  />
                  <div className="w-8 h-4.5 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-white"></div>
                </label>
              </div>
            </div>

            {/* Form Completion Progress */}
            <div className="rounded-2xl border border-[#1f1f23] bg-[#09090b] p-6 space-y-4">
              <h3 className="font-extrabold text-white border-b border-[#1f1f23] pb-2">Form Completion</h3>
              <div className="space-y-3">
                {checklist.map((item) => (
                  <div key={item.label} className="flex items-center gap-2.5">
                    <div className={`h-4.5 w-4.5 rounded-md border flex items-center justify-center transition ${
                      item.completed 
                        ? 'bg-white border-white text-black' 
                        : 'border-[#1f1f23] bg-[#141417] text-transparent'
                    }`}>
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                    <span className={`text-[11px] font-semibold ${item.completed ? 'text-white' : 'text-zinc-550'}`}>
                      {item.label}
                    </span>
                  </div>
                ))}

                <div className="pt-2">
                  <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 mb-1.5">
                    <span>Completion</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white rounded-full transition-all duration-305" 
                      style={{ width: `${progressPercent}%` }} 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Sticky Action Bar */}
          <div className="lg:col-span-3 flex flex-col sm:flex-row sm:items-center sm:justify-between p-5 border border-[#1f1f23] rounded-2xl bg-[#09090b] gap-4">
            <div className="flex items-center gap-2 text-zinc-550 font-semibold">
              <Info className="h-4 w-4" />
              <span>Fields marked with * are required before saving.</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setView('list')}
                className="px-4 py-2 border border-[#1f1f23] bg-transparent hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-xl font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-white hover:bg-zinc-200 text-black rounded-xl font-extrabold shadow-md transition disabled:opacity-55 cursor-pointer"
              >
                {loading ? 'Saving...' : editingProduct ? 'Save Product' : 'Add Product'}
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search & Actions Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#141417] border border-[#1f1f23] rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-500 transition text-zinc-200 text-xs"
          />
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-white hover:bg-zinc-200 px-4 py-2 text-xs font-bold text-black shadow-md transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Products Table */}
      <div className="overflow-hidden rounded-2xl border border-[#1f1f23] bg-[#09090b] shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs select-none">
            <thead>
              <tr className="border-b border-[#1f1f23] bg-[#141417]/50 text-zinc-500 font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Product Details</th>
                <th className="px-6 py-4">Dimension</th>
                <th className="px-6 py-4">Current Stock</th>
                <th className="px-6 py-4">Base Price</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f1f23] text-zinc-300">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
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
                    <tr key={product.id} className="hover:bg-[#141417]/30 transition">
                      <td className="px-6 py-4">
                        <div className="font-bold text-white text-sm">{product.name}</div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">SKU: {product.sku}</div>
                        {product.description && (
                          <div className="text-[10px] text-zinc-500 mt-1 line-clamp-1">{product.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold bg-[#141417] text-zinc-400 border border-[#1f1f23]">
                          {product.dimensionType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className={isOutOfStock(qVal) ? 'text-rose-455' : isLowStock ? 'text-amber-455' : 'text-zinc-200'}>
                            {product.dimensionType === 'WEIGHT' && qVal >= 1000 
                              ? `${convertFromBaseUnit(qVal, 'kg')} kg`
                              : product.dimensionType === 'VOLUME' && qVal >= 1000
                              ? `${convertFromBaseUnit(qVal, 'L')} L`
                              : `${qVal} ${baseUnit}`}
                          </span>
                          {isLowStock && (
                            <span className="text-amber-500" title="Low stock alert">
                              <AlertTriangle className="h-4 w-4" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-white">{formatINR(pVal)}/{baseUnit}</div>
                        {baseUnit !== 'items' && (
                          <div className="text-[10px] text-zinc-500 mt-0.5 font-medium">
                            {baseUnit === 'g' ? `(${formatINR(pVal * 1000)}/kg)` : `(${formatINR(pVal * 1000)}/L)`}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(product)}
                            className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-900 rounded-xl border border-transparent hover:border-[#1f1f23] transition cursor-pointer"
                            title="Edit product"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-zinc-900 rounded-xl border border-transparent hover:border-[#1f1f23] transition cursor-pointer"
                            title="Delete product"
                          >
                            <Trash2 className="h-4 w-4" />
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
    </div>
  );
}

function isOutOfStock(q: number) {
  return q <= 0;
}

export default ProductManager;
