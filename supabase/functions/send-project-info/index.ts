import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProjectInfoRequest {
  recipientEmail: string;
  githubRepo?: string;
  adminCredentials?: {
    tempUser: string;
    tempPassword: string;
    expiresAt: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipientEmail, githubRepo, adminCredentials }: ProjectInfoRequest = await req.json();

    const projectInfoHTML = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 20px; text-align: center; }
            .section { margin: 20px 0; padding: 15px; border-left: 4px solid #10B981; background: #f8f9fa; }
            .critical { background: #fee2e2; border-left-color: #dc2626; }
            .code { background: #f1f5f9; padding: 10px; border-radius: 5px; font-family: monospace; }
            .priority { background: #fef3c7; border-left-color: #f59e0b; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎮 PUOSU Platform - Technical Documentation</h1>
            <p>Gaming Tournament & Wager Platform - Emergency Technical Handoff</p>
          </div>

          <div class="section critical">
            <h2>🚨 CRITICAL ISSUES REQUIRING IMMEDIATE ATTENTION</h2>
            <ol>
              <li><strong>Input Field Bug</strong>: Users cannot type in gamertag input on /games page (blocking core functionality)</li>
              <li><strong>COD API Fallbacks</strong>: Need robust fallback mechanisms when game APIs return HTML errors</li>
              <li><strong>Tournament Automation</strong>: Complex bracket generation needs optimization</li>
            </ol>
          </div>

          <div class="section">
            <h2>🏗️ SYSTEM ARCHITECTURE</h2>
            <table>
              <tr><th>Component</th><th>Technology</th><th>Purpose</th></tr>
              <tr><td>Frontend</td><td>React + TypeScript + Vite</td><td>User interface and real-time interactions</td></tr>
              <tr><td>Backend</td><td>Supabase (PostgreSQL + Edge Functions)</td><td>Database, authentication, serverless functions</td></tr>
              <tr><td>Styling</td><td>Tailwind CSS + shadcn/ui</td><td>Responsive design system</td></tr>
              <tr><td>Payment</td><td>Stripe/Tilled integration</td><td>Tournament entry fees and payouts</td></tr>
              <tr><td>Game APIs</td><td>Xbox Live, COD, Apex Legends</td><td>Real-time stat verification</td></tr>
            </table>
          </div>

          <div class="section">
            <h2>🗄️ DATABASE ACCESS</h2>
            <div class="code">
              <strong>Project ID:</strong> mwuakdaogbywysjplrmx<br>
              <strong>Supabase URL:</strong> https://mwuakdaogbywysjplrmx.supabase.co<br>
              <strong>Dashboard:</strong> <a href="https://supabase.com/dashboard/project/mwuakdaogbywysjplrmx">https://supabase.com/dashboard/project/mwuakdaogbywysjplrmx</a><br>
              <strong>SQL Editor:</strong> <a href="https://supabase.com/dashboard/project/mwuakdaogbywysjplrmx/sql/new">Direct Link</a>
            </div>
          </div>

          <div class="section">
            <h2>📊 KEY DATABASE TABLES</h2>
            <table>
              <tr><th>Table</th><th>Purpose</th><th>Critical Fields</th></tr>
              <tr><td>profiles</td><td>User data and wallets</td><td>user_id, wallet_balance, xbox_gamertag</td></tr>
              <tr><td>challenges</td><td>Wagers and tournaments</td><td>stake_amount, status, winner_id</td></tr>
              <tr><td>challenge_participants</td><td>Tournament entries</td><td>user_id, challenge_id, stake_paid</td></tr>
              <tr><td>challenge_stats</td><td>Game performance data</td><td>kills, deaths, score, verified</td></tr>
              <tr><td>tournaments</td><td>Bracket competitions</td><td>entry_fee, max_participants, status</td></tr>
              <tr><td>transactions</td><td>Financial records</td><td>amount, type, status</td></tr>
              <tr><td>admin_roles</td><td>Permission management</td><td>user_id, role</td></tr>
            </table>
          </div>

          <div class="section priority">
            <h2>🎯 TOP 3 UX PRIORITIES</h2>
            <ol>
              <li><strong>Fix Input Issues</strong> - Critical blocking bug preventing gamertag entry</li>
              <li><strong>Mobile Optimization</strong> - Gaming audience is 70%+ mobile users</li>
              <li><strong>Tournament Flow</strong> - Streamline registration and bracket viewing</li>
            </ol>
          </div>

          <div class="section">
            <h2>🔧 DEVELOPMENT SETUP</h2>
            <div class="code">
              # Clone repository (GitHub link provided separately)<br>
              npm install<br>
              npm run dev<br><br>
              # Required Environment Variables (already configured in Supabase):<br>
              - XBOX_API_KEY<br>
              - COD_SESSION_COOKIE<br>
              - OPENXBL_API_KEY<br>
              - STRIPE_SECRET_KEY<br>
              - RESEND_API_KEY
            </div>
          </div>

          <div class="section">
            <h2>🔐 SECURITY IMPLEMENTATION</h2>
            <ul>
              <li><strong>Row Level Security (RLS)</strong> enabled on all tables</li>
              <li><strong>API Rate Limiting</strong> via Supabase edge functions</li>
              <li><strong>Fraud Detection</strong> in suspicious_activities table</li>
              <li><strong>Escrow System</strong> for secure payment handling</li>
              <li><strong>Admin Audit Trail</strong> for all critical actions</li>
            </ul>
          </div>

          <div class="section">
            <h2>💰 REVENUE AUTOMATION</h2>
            <table>
              <tr><th>Revenue Stream</th><th>Implementation</th><th>Status</th></tr>
              <tr><td>Tournament Entry Fees</td><td>Automated collection via Stripe</td><td>✅ Active</td></tr>
              <tr><td>Wager Stakes</td><td>Escrow system with automated payouts</td><td>✅ Active</td></tr>
              <tr><td>Premium Subscriptions</td><td>Monthly/yearly billing</td><td>✅ Active</td></tr>
              <tr><td>Auto-Generated Tournaments</td><td>Scheduled tournament creation</td><td>🔧 Needs optimization</td></tr>
            </table>
          </div>

          <div class="section">
            <h2>🎮 GAME INTEGRATIONS</h2>
            <table>
              <tr><th>Game</th><th>API Status</th><th>Verification Method</th><th>Fallback</th></tr>
              <tr><td>Call of Duty</td><td>🔧 Unstable (HTML errors)</td><td>Auto stat pull</td><td>Manual entry</td></tr>
              <tr><td>Apex Legends</td><td>✅ Stable</td><td>API verification</td><td>Screenshot</td></tr>
              <tr><td>Rocket League</td><td>✅ Stable</td><td>API verification</td><td>Screenshot</td></tr>
              <tr><td>Xbox Live</td><td>✅ Stable</td><td>Live presence detection</td><td>Manual verification</td></tr>
            </table>
          </div>

          ${adminCredentials ? `
          <div class="section critical">
            <h2>🔑 TEMPORARY ADMIN ACCESS (24H EXPIRY)</h2>
            <div class="code">
              <strong>Username:</strong> ${adminCredentials.tempUser}<br>
              <strong>Password:</strong> ${adminCredentials.tempPassword}<br>
              <strong>Expires:</strong> ${adminCredentials.expiresAt}<br>
              <strong>Login URL:</strong> <a href="https://cad0db3f-ccc9-403e-a31a-cbece28dd2e9.lovableproject.com/auth">https://cad0db3f-ccc9-403e-a31a-cbece28dd2e9.lovableproject.com/auth</a>
            </div>
          </div>
          ` : ''}

          <div class="section">
            <h2>📱 CURRENT DEPLOYMENT</h2>
            <div class="code">
              <strong>Live URL:</strong> <a href="https://cad0db3f-ccc9-403e-a31a-cbece28dd2e9.lovableproject.com">https://cad0db3f-ccc9-403e-a31a-cbece28dd2e9.lovableproject.com</a><br>
              <strong>Admin Dashboard:</strong> /admin<br>
              <strong>Tournament View:</strong> /tournaments<br>
              <strong>Game Hub:</strong> /games
            </div>
          </div>

          <div class="section">
            <h2>📞 IMMEDIATE ACTION REQUIRED</h2>
            <ol>
              <li>Test COD gamertag input on /games page</li>
              <li>Review API error handling in supabase/functions/cod-multiplayer-stats/</li>
              <li>Examine Input component in src/components/games/CODLatestMatch.tsx</li>
              <li>Implement robust fallback mechanisms for API failures</li>
              <li>Optimize tournament bracket generation algorithm</li>
            </ol>
          </div>

          <footer style="margin-top: 40px; padding: 20px; background: #f8f9fa; text-align: center; color: #6b7280;">
            <p>This is an automated technical handoff email. For immediate assistance, contact the development team.</p>
            <p><strong>Platform:</strong> Put Up or Shut Up Gaming Platform | <strong>Generated:</strong> ${new Date().toISOString()}</p>
          </footer>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "PUOSU Platform <onboarding@resend.dev>",
      to: [recipientEmail],
      subject: "🚨 URGENT: PUOSU Platform Technical Handoff - Critical Issues Need Immediate Attention",
      html: projectInfoHTML,
    });

    console.log("Project info email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Project information sent successfully",
      emailId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in send-project-info function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);