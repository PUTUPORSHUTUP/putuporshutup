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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user) {
      throw new Error("User not authenticated");
    }

    console.log("Processing withdrawal for user:", user.id);

    // Get request body
    const { amount, method, account_details } = await req.json();
    
    if (!amount || amount < 10) {
      throw new Error("Minimum withdrawal amount is $10");
    }

    if (!method || !account_details) {
      throw new Error("Payment method and account details are required");
    }

    // Create service client for secure database operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get user's current balance
    const { data: profile, error: profileError } = await supabaseService
      .from("profiles")
      .select("wallet_balance")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      throw new Error("Unable to retrieve user profile");
    }

    if (profile.wallet_balance < amount) {
      throw new Error(`Insufficient funds. Available balance: $${profile.wallet_balance.toFixed(2)}`);
    }

    // Use the wallet balance update function if it exists, otherwise manual transaction
    try {
      const { data: walletResult, error: walletError } = await supabaseService
        .rpc('update_wallet_balance', {
          user_uuid: user.id,
          amount_change: -amount,
          txn_type: 'withdrawal',
          txn_description: `Withdrawal via ${method}`
        });

      if (walletError) {
        console.log("Wallet function not available, using manual transaction");
        
        // Manual transaction approach
        const { error: updateError } = await supabaseService
          .from("profiles")
          .update({ 
            wallet_balance: profile.wallet_balance - amount,
            updated_at: new Date().toISOString()
          })
          .eq("user_id", user.id);

        if (updateError) {
          throw new Error("Failed to update wallet balance");
        }

        // Create transaction record
        const { error: insertError } = await supabaseService.from("transactions").insert({
          user_id: user.id,
          type: "withdrawal",
          amount: -amount, // Negative for withdrawal
          status: "completed", // Instant withdrawal for now
          description: `Withdrawal via ${method}`,
          created_at: new Date().toISOString()
        });

        if (insertError) {
          console.error("Error creating transaction record:", insertError);
        }
      } else {
        console.log("Wallet function executed successfully:", walletResult);
      }
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      throw new Error("Failed to process withdrawal");
    }

    // In a real implementation, you would:
    // 1. Integrate with a payment processor for actual payouts
    // 2. Handle different withdrawal methods (bank transfer, PayPal, etc.)
    // 3. Add withdrawal limits and verification requirements
    // 4. Queue withdrawals for manual review if needed

    console.log(`Withdrawal processed: $${amount} for user ${user.id}`);

    return new Response(JSON.stringify({ 
      success: true,
      amount: amount,
      new_balance: profile.wallet_balance - amount,
      method: method,
      message: "Withdrawal processed successfully"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Withdrawal error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Withdrawal processing failed" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});