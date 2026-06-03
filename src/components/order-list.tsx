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
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 text-zinc-500">
          <ShoppingBag className="h-10 w-10 mb-2 opacity-50" />
          <p>No orders found.</p>
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
                className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-sm"
              >
                {/* Order Summary Row */}
                <div
                  onClick={() => toggleExpand(order.id)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition cursor-pointer gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className={`rounded-xl p-2.5 ${
                      order.status === 'COMPLETED'
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                        : order.status === 'CANCELLED'
                        ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400'
                        : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
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
                        <span className="font-bold text-zinc-900 dark:text-zinc-50">
                          Order #{order.id.slice(0, 8)}
                        </span>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          order.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                            : order.status === 'CANCELLED'
                            ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        <span>{order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}</span>
                        {isAdmin && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {order.userEmail}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6">
                    <div className="text-right">
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Total Price</p>
                      <p className="text-lg font-extrabold text-zinc-900 dark:text-zinc-50 mt-0.5">
                        {formatINR(order.totalAmount)}
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-zinc-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-zinc-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-zinc-100 bg-zinc-50/30 px-6 py-5 dark:border-zinc-800 dark:bg-zinc-800/10 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                      Order Line Items
                    </h4>
                    
                    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-zinc-200 bg-zinc-50/50 text-xs font-semibold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/30 dark:text-zinc-400">
                            <th className="px-4 py-2.5">Product</th>
                            <th className="px-4 py-2.5">Ordered Quantity</th>
                            <th className="px-4 py-2.5">Price Unit</th>
                            <th className="px-4 py-2.5 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
                          {orderItemsFiltered.map((item) => {
                            const qtyVal = parseFloat(item.quantity);
                            const priceVal = parseFloat(item.priceAtTime);
                            const subtotal = qtyVal * priceVal;
                            const displayQty = formatOrderedQuantity(item.quantity, item.dimensionType);
                            const baseUnit = item.dimensionType === 'WEIGHT' ? 'g' : item.dimensionType === 'VOLUME' ? 'mL' : 'items';

                            return (
                              <tr key={item.id}>
                                <td className="px-4 py-2.5">
                                  <div className="font-semibold text-zinc-900 dark:text-zinc-50">{item.productName}</div>
                                  <div className="text-[10px] text-zinc-400 dark:text-zinc-500">SKU: {item.sku}</div>
                                </td>
                                <td className="px-4 py-2.5">{displayQty}</td>
                                <td className="px-4 py-2.5">{formatINR(priceVal)}/{baseUnit}</td>
                                <td className="px-4 py-2.5 text-right font-bold text-zinc-900 dark:text-zinc-50">
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
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800/80 gap-3">
                        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                          Change Status (Admin Action):
                        </span>
                        
                        <div className="flex gap-2">
                          {['PENDING', 'COMPLETED', 'CANCELLED'].map((st) => (
                            <button
                              key={st}
                              disabled={isUpdating || order.status === st}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(order.id, st as any);
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                                order.status === st
                                  ? 'bg-zinc-100 border-zinc-250 text-zinc-800 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200'
                                  : st === 'COMPLETED'
                                  ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-400 dark:hover:bg-emerald-950/20'
                                  : st === 'CANCELLED'
                                  ? 'border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/20'
                                  : 'border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-900 dark:text-amber-400 dark:hover:bg-amber-950/20'
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
