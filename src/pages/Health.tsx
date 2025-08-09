import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'down';
  timestamp: string;
  database: boolean;
  auth: boolean;
  functions: boolean;
  uptime: number;
}

export default function Health() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const startTime = Date.now();

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    const checks = {
      database: false,
      auth: false,
      functions: false,
    };

    try {
      // Database check
      const { data: dbCheck } = await supabase
        .from("profiles")
        .select("id")
        .limit(1);
      checks.database = !!dbCheck;

      // Auth check
      const { data: { session } } = await supabase.auth.getSession();
      checks.auth = true; // Just checking if auth service responds

      // Functions check - ping a lightweight function
      try {
        await supabase.functions.invoke('platform-health-monitor');
        checks.functions = true;
      } catch {
        checks.functions = false;
      }

    } catch (error) {
      console.warn('Health check partial failure:', error);
    }

    const allHealthy = Object.values(checks).every(Boolean);
    const someHealthy = Object.values(checks).some(Boolean);

    setHealth({
      status: allHealthy ? 'healthy' : someHealthy ? 'degraded' : 'down',
      timestamp: new Date().toISOString(),
      database: checks.database,
      auth: checks.auth,
      functions: checks.functions,
      uptime: Date.now() - startTime,
    });
  };

  // Return JSON for programmatic checks
  if (window.location.search.includes('format=json')) {
    return (
      <pre style={{ fontFamily: 'monospace', margin: 0, padding: '1rem' }}>
        {JSON.stringify(health, null, 2)}
      </pre>
    );
  }

  return (
    <div style={{ 
      fontFamily: 'system-ui, sans-serif', 
      padding: '2rem',
      maxWidth: '600px',
      margin: '0 auto',
      backgroundColor: health?.status === 'healthy' ? '#dcfce7' : '#fef2f2',
      color: health?.status === 'healthy' ? '#166534' : '#dc2626'
    }}>
      <h1 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem' }}>
        Platform Health Status
      </h1>
      
      {health ? (
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <strong>Status:</strong> {health.status.toUpperCase()}
          </div>
          <div>
            <strong>Timestamp:</strong> {health.timestamp}
          </div>
          <div>
            <strong>Uptime Check:</strong> {health.uptime}ms
          </div>
          
          <div style={{ display: 'grid', gap: '0.5rem', marginTop: '1rem' }}>
            <div>📊 Database: {health.database ? '✅ Connected' : '❌ Failed'}</div>
            <div>🔐 Authentication: {health.auth ? '✅ Active' : '❌ Failed'}</div>
            <div>⚡ Functions: {health.functions ? '✅ Running' : '❌ Failed'}</div>
          </div>
          
          <div style={{ marginTop: '1rem', fontSize: '0.875rem', opacity: 0.8 }}>
            Last checked: {new Date(health.timestamp).toLocaleString()}
          </div>
        </div>
      ) : (
        <div>Checking system health...</div>
      )}
    </div>
  );
}