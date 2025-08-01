import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verify admin user from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error("Invalid authentication");
    }

    // Check if user is admin
    const { data: adminCheck } = await supabaseAdmin
      .from('admin_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .eq('role', 'admin')
      .single();

    if (!adminCheck) {
      throw new Error("Admin access required");
    }

    const { payment_id, action, admin_notes } = await req.json();

    if (!payment_id || !action) {
      throw new Error("Payment ID and action are required");
    }

    console.log(`Processing payment ${payment_id} with action: ${action}`);

    // Get the payment request
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('manual_payment_requests')
      .select('*')
      .eq('id', payment_id)
      .single();

    if (paymentError || !payment) {
      throw new Error("Payment request not found");
    }

    if (payment.status !== 'pending') {
      throw new Error("Payment request is not pending");
    }

    let updateData: any = {
      processed_by: userData.user.id,
      processed_at: new Date().toISOString(),
      admin_notes: admin_notes || null,
      updated_at: new Date().toISOString()
    };

    if (action === 'approve') {
      updateData.status = 'completed';

      // Update payment request status
      const { error: updateError } = await supabaseAdmin
        .from('manual_payment_requests')
        .update(updateData)
        .eq('id', payment_id);

      if (updateError) {
        throw new Error(`Failed to update payment: ${updateError.message}`);
      }

      // Add funds to user's wallet if it's a deposit
      if (payment.type === 'deposit') {
        // Get current wallet balance
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('wallet_balance')
          .eq('user_id', payment.user_id)
          .single();

        if (profileError) {
          throw new Error(`Failed to get user profile: ${profileError.message}`);
        }

        const newBalance = (profile?.wallet_balance || 0) + payment.amount;

        // Update wallet balance
        const { error: balanceError } = await supabaseAdmin
          .from('profiles')
          .update({
            wallet_balance: newBalance,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', payment.user_id);

        if (balanceError) {
          throw new Error(`Failed to update wallet balance: ${balanceError.message}`);
        }

        // Create transaction record
        const { error: transactionError } = await supabaseAdmin
          .from('transactions')
          .insert({
            user_id: payment.user_id,
            type: 'deposit',
            amount: payment.amount,
            status: 'completed',
            description: `${payment.payment_method} deposit processed by admin`,
            created_at: new Date().toISOString()
          });

        if (transactionError) {
          console.error('Failed to create transaction record:', transactionError);
        }

        console.log(`Approved deposit: $${payment.amount} added to user ${payment.user_id} wallet`);
      }

    } else if (action === 'reject') {
      updateData.status = 'rejected';

      // Update payment request status
      const { error: updateError } = await supabaseAdmin
        .from('manual_payment_requests')
        .update(updateData)
        .eq('id', payment_id);

      if (updateError) {
        throw new Error(`Failed to update payment: ${updateError.message}`);
      }

      console.log(`Rejected payment request ${payment_id}`);
    } else {
      throw new Error("Invalid action. Must be 'approve' or 'reject'");
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Payment ${action}d successfully`,
      payment_id: payment_id
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Payment processing error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Payment processing failed" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});