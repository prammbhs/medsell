"use client";

import React, { useState } from 'react';
import { updateOrderStatus } from '@/app/admin/actions';
import { formatINR } from '@/lib/conversions';
import { ChevronDown, ChevronUp, ShoppingBag, Clock, CheckCircle2, XCircle, User } from 'lucide-react';

interface Order {
  id: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  totalAmount: string;
  createdAt: Date | null;
  userEmail: string;
}

interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: string;
  priceAtTime: string;
  productName: string;
  sku: string;
  dimensionType: 'WEIGHT' | 'VOLUME' | 'COUNT';
}

export function OrderList({
  initialOrders,
  allItems,
  isAdmin,
}: {
  initialOrders: Order[];
  allItems: OrderItem[];
  isAdmin: boolean;
}) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const toggleExpand = (orderId: string) => {
    setExpandedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const handleStatusChange = async (orderId: string, newStatus: 'PENDING' | 'COMPLETED' | 'CANCELLED') => {
    setUpdatingId(orderId);
    const result = await updateOrderStatus(orderId, newStatus);
    if (result.error) {
      alert(result.error);
      setUpdatingId(null);
    } else {
      // Local state update
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      setUpdatingId(null);
    }
  };

  // Format quantities for displaying order item quantities nicely
  const formatOrderedQuantity = (qtyStr: string, dimension: 'WEIGHT' | 'VOLUME' | 'COUNT') => {
    const qty = parseFloat(qtyStr);
    if (dimension === 'WEIGHT') {
      return qty >= 1000 ? `${qty / 1000} kg` : `${qty} g`;
    }
    if (dimension === 'VOLUME') {
      return qty >= 1000 ? `${qty / 1000} L` : `${qty} mL`;
    }
    return `${qty} items`;
  };

  return (
    <div className="space-y-4">
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-[#1f1f23] rounded-2xl bg-[#09090b] text-zinc-550">
          <ShoppingBag className="h-10 w-10 mb-2 opacity-50 text-zinc-650" />
          <p className="text-xs">No orders found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const isExpanded = expandedOrders[order.id];
            const orderItemsFiltered = allItems.filter(item => item.orderId === order.id);
            const isUpdating = updatingId === order.id;

            return (
              <div
                key={order.id}
                className="overflow-hidden rounded-2xl border border-[#1f1f23] bg-[#09090b] shadow-md"
              >
                {/* Order Summary Row */}
                <div
                  onClick={() => toggleExpand(order.id)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-[#141417]/50 transition cursor-pointer gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className={`rounded-xl p-2.5 ${
                      order.status === 'COMPLETED'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                        : order.status === 'CANCELLED'
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                        : 'bg-orange-500/15 text-orange-400 border border-orange-500/25'
                    }`}>
                      {order.status === 'COMPLETED' ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : order.status === 'CANCELLED' ? (
                        <XCircle className="h-5 w-5" />
                      ) : (
                        <Clock className="h-5 w-5" />
                      )}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">
                          Order #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          order.status === 'COMPLETED'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                            : order.status === 'CANCELLED'
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                            : 'bg-orange-500/15 text-orange-400 border border-orange-500/25'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 mt-1">
                        <span>{order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}</span>
                        {isAdmin && (
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5 text-zinc-400" />
                            {order.userEmail}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6">
                    <div className="text-right">
                      <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Total Price</p>
                      <p className="text-base font-extrabold text-white mt-0.5">
                        {formatINR(parseFloat(order.totalAmount))}
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-zinc-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-zinc-500" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-[#1f1f23] bg-[#09090b] px-6 py-5 space-y-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                      Order Line Items
                    </h4>
                    
                    <div className="overflow-hidden rounded-xl border border-[#1f1f23] bg-[#141417]">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-[#1f1f23] bg-zinc-900/30 text-zinc-500 font-bold">
                            <th className="px-4 py-3">Product</th>
                            <th className="px-4 py-3">Ordered Quantity</th>
                            <th className="px-4 py-3">Price Unit</th>
                            <th className="px-4 py-3 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1f1f23] text-zinc-300">
                          {orderItemsFiltered.map((item) => {
                            const qtyVal = parseFloat(item.quantity);
                            const priceVal = parseFloat(item.priceAtTime);
                            const subtotal = qtyVal * priceVal;
                            const displayQty = formatOrderedQuantity(item.quantity, item.dimensionType);
                            const baseUnit = item.dimensionType === 'WEIGHT' ? 'g' : item.dimensionType === 'VOLUME' ? 'mL' : 'items';

                            return (
                              <tr key={item.id} className="hover:bg-zinc-900/10">
                                <td className="px-4 py-3">
                                  <div className="font-bold text-white">{item.productName}</div>
                                  <div className="text-[10px] text-zinc-500 mt-0.5">SKU: {item.sku}</div>
                                </td>
                                <td className="px-4 py-3">{displayQty}</td>
                                <td className="px-4 py-3">{formatINR(priceVal)}/{baseUnit}</td>
                                <td className="px-4 py-3 text-right font-bold text-white">
                                  {formatINR(subtotal)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Admin Status Actions */}
                    {isAdmin && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 border-t border-[#1f1f23] gap-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                          Change Status (Admin Action):
                        </span>
                        
                        <div className="flex gap-2">
                          {['PENDING', 'COMPLETED', 'CANCELLED'].map((st) => (
                            <button
                              key={st}
                              disabled={isUpdating || order.status === st}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(order.id, st as 'PENDING' | 'COMPLETED' | 'CANCELLED');
                              }}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                                order.status === st
                                  ? 'bg-[#141417] border-[#1f1f23] text-zinc-300'
                                  : st === 'COMPLETED'
                                  ? 'border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/10'
                                  : st === 'CANCELLED'
                                  ? 'border-rose-500/25 text-rose-400 hover:bg-rose-500/10'
                                  : 'border-orange-500/25 text-orange-400 hover:bg-orange-500/10'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
export default OrderList;
