// // supabase/functions/process-sale/index.ts

// import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// import { corsHeaders } from '../_shared/cors.ts';

// // Interface for the incoming request data
// interface SalePayload {
//   cartItems: {
//     id: string; // Inventory item ID
//     cart_quantity: number;
//   }[];
//   customer: {
//     name: string;
//     phone: string;
//     email: string;
//   };
//   billData: any; // The full billData object for the sales record
// }

// Deno.serve(async (req) => {
//   // Handle CORS preflight request
//   if (req.method === 'OPTIONS') {
//     return new Response('ok', { headers: corsHeaders });
//   }

//   try {
//     // 1. --- AUTHENTICATION ---
//     // Create a Supabase client with the user's auth token to verify they are logged in.
//     const authHeader = req.headers.get('Authorization')!;
//     const userSupabaseClient = createClient(
//       Deno.env.get('SUPABASE_URL') ?? '',
//       Deno.env.get('SUPABASE_ANON_KEY') ?? '',
//       { global: { headers: { Authorization: authHeader } } }
//     );
    
//     const { data: { user }, error: userError } = await userSupabaseClient.auth.getUser();
//     if (userError || !user) {
//       console.error('User auth error:', userError);
//       return new Response(JSON.stringify({ error: 'Unauthorized' }), {
//         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
//         status: 401,
//       });
//     }

//     const { cartItems, customer, billData }: SalePayload = await req.json();
//     if (!cartItems || !customer || !billData) {
//       throw new Error('Missing required sale data in the request body.');
//     }
    
//     // 2. --- AUTHORIZATION (PRIVILEGED ACTION) ---
//     // Create a privileged Supabase client using the service_role key.
//     // This client can bypass RLS policies.
//     const serviceSupabaseClient = createClient(
//       Deno.env.get('SUPABASE_URL') ?? '',
//       Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
//     );

//     // 3. --- DATABASE TRANSACTION ---
//     // First, fetch the current quantities of items in the cart to ensure stock is available.
//     // This prevents race conditions.
//     const itemIds = cartItems.map(item => item.id);
//     const { data: currentInventory, error: inventoryError } = await serviceSupabaseClient
//       .from('inventory')
//       .select('id, quantity')
//       .in('id', itemIds);

//     if (inventoryError) throw inventoryError;

//     // Create an inventory map for quick lookup
//     const inventoryMap = new Map(currentInventory.map(item => [item.id, item.quantity]));

//     // Prepare the inventory updates
//     const inventoryUpdates = cartItems.map(item => {
//       const currentStock = inventoryMap.get(item.id);
//       if (currentStock === undefined || currentStock < item.cart_quantity) {
//         throw new Error(`Insufficient stock for item ID: ${item.id}.`);
//       }
//       // Use rpc to perform an atomic decrement
//       return serviceSupabaseClient.rpc('decrement_inventory_quantity', {
//         item_id: item.id,
//         decrement_amount: item.cart_quantity,
//       });
//     });

//     // Prepare the sales insert
//     const saleInsert = {
//       user_id: user.id, // <-- IMPORTANT: Use the ID of the authenticated user
//       customer_name: customer.name,
//       customer_phone: customer.phone,
//       customer_email: customer.email,
//       items: JSON.stringify(billData.items),
//       total_amount: billData.finalAmount,
//       bill_data: JSON.stringify(billData),
//       payment_status: 'completed',
//     };

//     // Execute all database operations concurrently
//     const [_, salesResult] = await Promise.all([
//       Promise.all(inventoryUpdates),
//       serviceSupabaseClient.from('sales').insert(saleInsert).select().single()
//     ]);

//     if (salesResult.error) {
//       throw salesResult.error;
//     }

//     // 4. --- RETURN SUCCESS ---
//     return new Response(JSON.stringify({ success: true, sale: salesResult.data }), {
//       headers: { ...corsHeaders, 'Content-Type': 'application/json' },
//       status: 200,
//     });
//   } catch (err) {
//     console.error('Error in process-sale function:', err);
//     return new Response(String(err?.message ?? err), {
//       headers: { ...corsHeaders, 'Content-Type': 'application/json' },
//       status: 400,
//     });
//   }
// });

// supabase/functions/process-sale/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// This function safely decrements inventory stock.
// Run this in your Supabase SQL Editor ONCE:
/*
  CREATE OR REPLACE FUNCTION decrement_inventory(p_item_id uuid, p_quantity int)
  RETURNS void AS $$
  BEGIN
    UPDATE public.inventory
    SET quantity = quantity - p_quantity
    WHERE id = p_item_id AND quantity >= p_quantity; -- Only update if stock is sufficient
  END;
  $$ LANGUAGE plpgsql;
*/

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Use service role for backend operations
    )
    
    const { billData } = await req.json()

    if (!billData || !billData.items) {
      throw new Error('Missing billData or items in request body');
    }

    // 1. Insert the sale into the 'sales' table
    const { data: saleRecord, error: saleError } = await supabaseAdmin
      .from('sales')
      .insert({
        user_id: billData.userId, // Assuming you add userId to billData
        customer_name: billData.customer.name,
        customer_phone: billData.customer.phone,
        customer_email: billData.customer.email,
        items: billData.items,
        total_amount: billData.finalAmount,
        bill_data: billData,
        payment_status: 'completed',
      })
      .select()
      .single()

    if (saleError) throw saleError

    // 2. Atomically update inventory quantities using the Postgres function
    const inventoryUpdatePromises = billData.items.map(item =>
      supabaseAdmin.rpc('decrement_inventory', {
        p_item_id: item.id,
        p_quantity: item.cart_quantity,
      })
    )
    
    const updateResults = await Promise.all(inventoryUpdatePromises)
    const updateErrors = updateResults.filter(res => res.error);

    if (updateErrors.length > 0) {
      console.error('Inventory update failed for some items:', updateErrors);
      // In a real production app, you might flag this sale for manual review.
    }
    
    return new Response(JSON.stringify({ saleRecord }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})