import { supabase } from '@/integrations/supabase/client';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
  timestamp: string;
}

interface DiagnosticLog {
  timestamp: string;
  endpoint: string;
  status: number;
  error: string;
  headers?: Record<string, string>;
  body?: any;
  responseTime?: number;
}

class ApiClient {
  private diagnosticLogs: DiagnosticLog[] = [];
  private baseUrl = 'https://mwuakdaogbywysjplrmx.supabase.co/functions/v1';

  /**
   * Secure API call with automatic authorization and error handling
   */
  async call<T = any>(
    endpoint: string, 
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      body?: any;
      headers?: Record<string, string>;
      useServiceRole?: boolean;
    } = {}
  ): Promise<ApiResponse<T>> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    
    try {
      // Get current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token && !options.useServiceRole) {
        throw new Error('No valid session found. Please log in.');
      }

      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dWFrZGFvZ2J5d3lzanBscm14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMzc1MjMsImV4cCI6MjA2ODYxMzUyM30.Ocg97rg7G0Zkuf12DW5udFRwmpK1rL2EKthgvdVStpQ',
        ...options.headers,
      };

      // Add authorization
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      // Prefer Supabase SDK when possible
      if (options.method === 'POST' || !options.method) {
        try {
          const { data, error } = await supabase.functions.invoke(endpoint, {
            body: options.body
          });

          if (error) throw error;

          return {
            data,
            status: 200,
            timestamp
          };
        } catch (sdkError) {
          // Fall back to fetch if SDK fails
          console.warn('SDK call failed, falling back to fetch:', sdkError);
        }
      }

      // Fallback to raw fetch
      const response = await fetch(`${this.baseUrl}/${endpoint}`, {
        method: options.method || 'POST',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      const responseTime = Date.now() - startTime;
      let responseData;

      try {
        responseData = await response.json();
      } catch {
        responseData = await response.text();
      }

      if (!response.ok) {
        const error = `HTTP ${response.status}: ${responseData?.message || responseData || 'Unknown error'}`;
        
        // Log diagnostic information
        this.logDiagnostic({
          timestamp,
          endpoint,
          status: response.status,
          error,
          headers,
          body: options.body,
          responseTime
        });

        return {
          error,
          status: response.status,
          timestamp
        };
      }

      return {
        data: responseData,
        status: response.status,
        timestamp
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      const responseTime = Date.now() - startTime;
      
      // Log diagnostic information
      this.logDiagnostic({
        timestamp,
        endpoint,
        status: 0,
        error: errorMessage,
        headers: options.headers,
        body: options.body,
        responseTime
      });

      return {
        error: errorMessage,
        status: 0,
        timestamp
      };
    }
  }

  /**
   * Admin-specific API calls that use the admin proxy
   */
  async adminCall<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    // For admin calls, use the admin_sim_proxy pattern
    const proxyEndpoint = endpoint.includes('admin') ? endpoint : `admin_sim_proxy`;
    const proxyBody = endpoint === 'sim_runner' ? body : { endpoint, ...body };

    return this.call<T>(proxyEndpoint, {
      method: 'POST',
      body: proxyBody
    });
  }

  /**
   * Log diagnostic information for failed requests
   */
  private logDiagnostic(log: DiagnosticLog) {
    this.diagnosticLogs.push(log);
    
    // Keep only last 100 logs to prevent memory issues
    if (this.diagnosticLogs.length > 100) {
      this.diagnosticLogs = this.diagnosticLogs.slice(-100);
    }

    // Also log to Supabase for admin review
    this.persistDiagnostic(log).catch(console.error);
  }

  /**
   * Persist diagnostic logs to Supabase for admin review
   */
  private async persistDiagnostic(log: DiagnosticLog) {
    try {
      await supabase.from('payout_automation_log').insert({
        event_type: 'api_diagnostic',
        status: log.status >= 200 && log.status < 300 ? 'success' : 'error',
        error_message: log.error,
        created_at: log.timestamp,
        entity_type: 'api_call',
        entity_id: log.endpoint,
        metadata: {
          endpoint: log.endpoint,
          status: log.status,
          headers: log.headers,
          body: log.body,
          responseTime: log.responseTime
        }
      });
    } catch (error) {
      console.error('Failed to persist diagnostic log:', error);
    }
  }

  /**
   * Get diagnostic logs for admin review
   */
  getDiagnosticLogs(): DiagnosticLog[] {
    return [...this.diagnosticLogs];
  }

  /**
   * Clear diagnostic logs
   */
  clearDiagnosticLogs() {
    this.diagnosticLogs = [];
  }

  /**
   * Check if the current user has admin privileges
   */
  async isAdmin(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return false;

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('user_id', session.user.id)
        .single();

      return profile?.is_admin || false;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export types for use in components
export type { ApiResponse, DiagnosticLog };
