import { supabase } from '@/lib/supabase';
import type { OrderInsert, OrderItemInsert, OrderRow, OrderUpdate } from '@/types/database';

export interface OrderWithSupplier extends OrderRow {
  supplierName: string | null;
}

export async function listOrders(): Promise<OrderWithSupplier[]> {
  const { data: orders, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
  if (error) throw error;

  const supplierIds = [...new Set(orders.map((o) => o.supplier_id).filter((id): id is string => !!id))];
  const supplierNameById = new Map<string, string>();
  if (supplierIds.length > 0) {
    const { data: suppliers, error: suppliersError } = await supabase.from('suppliers').select('id, name').in('id', supplierIds);
    if (suppliersError) throw suppliersError;
    for (const supplier of suppliers) supplierNameById.set(supplier.id, supplier.name);
  }

  return orders.map((order) => ({ ...order, supplierName: order.supplier_id ? (supplierNameById.get(order.supplier_id) ?? null) : null }));
}

export async function createOrder(input: OrderInsert) {
  const { data, error } = await supabase.from('orders').insert(input).select('id').single();
  if (error) throw error;
  return data.id;
}

export async function updateOrder(id: string, input: OrderUpdate) {
  const { error } = await supabase.from('orders').update(input).eq('id', id);
  if (error) throw error;
}

export async function deleteOrder(id: string) {
  const { error } = await supabase.from('orders').delete().eq('id', id);
  if (error) throw error;
}

export async function listOrderItems(orderId: string) {
  const { data, error } = await supabase.from('order_items').select('*').eq('order_id', orderId).order('product_name');
  if (error) throw error;
  return data;
}

export async function addOrderItem(input: OrderItemInsert) {
  const { error } = await supabase.from('order_items').insert(input);
  if (error) throw error;
}

export async function deleteOrderItem(id: string) {
  const { error } = await supabase.from('order_items').delete().eq('id', id);
  if (error) throw error;
}
