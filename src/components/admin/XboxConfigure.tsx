import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, XCircle, Gamepad2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ipRe = /^(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)$/;

interface ValidationStep {
  step: string;
  ok: boolean;
  detail: string;
}

export function XboxConfigure() {
  const [ip, setIp] = useState("");
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [steps, setSteps] = useState<ValidationStep[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const { toast } = useToast();

  const valid = ipRe.test(ip) && key.trim().length >= 20;

  async function onConfigure() {
    setErr(null); 
    setSteps([]); 
    setBusy(true);
    
    try {
      // 1) Local validation
      if (!valid) { 
        throw new Error("Enter a valid IPv4 and API key (20+ chars)."); 
      }

      console.log('🔧 Configuring Xbox integration...');

      // 2) Store securely in DB (encrypts key)
      const { data, error } = await supabase.rpc("xbox_configure", {
        p_console_ip: ip, 
        p_api_key: key
      });
      
      if (error) {
        console.error('❌ Configuration failed:', error);
        throw error;
      }
      
      console.log('✅ Configuration stored:', data);
      setSteps((data as any)?.steps ?? []);

      toast({
        title: "Configuration Saved",
        description: "Xbox integration settings have been securely stored.",
      });

      // 3) Live validation via Edge Function
      console.log('🔍 Running live validation...');
      const resp = await supabase.functions.invoke('xbl_validate');
      
      if (resp.error) {
        console.error('❌ Validation failed:', resp.error);
        throw new Error(resp.error.message || "Validation failed");
      }

      const json = resp.data;
      console.log('✅ Validation completed:', json);
      
      setSteps((prev) => [...prev, ...(json.steps || [])]);

      if (json.ok) {
        toast({
          title: "Validation Successful",
          description: "Xbox console is reachable and API key is valid.",
        });
      } else {
        toast({
          title: "Validation Issues",
          description: "Configuration saved but some validation steps failed.",
          variant: "destructive",
        });
      }

    } catch (e: any) {
      console.error('💥 Configuration error:', e);
      const errorMessage = e.message || String(e);
      setErr(errorMessage);
      toast({
        title: "Configuration Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gamepad2 className="h-5 w-5 text-primary" />
          Xbox Integration Configuration
        </CardTitle>
        <CardDescription>
          Configure console IP and API key for automated Xbox Live verification
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Xbox Console IP</label>
            <Input 
              placeholder="192.168.1.50" 
              value={ip} 
              onChange={(e) => setIp(e.target.value)}
              className={!ipRe.test(ip) && ip ? "border-destructive" : ""}
            />
            <p className="text-xs text-muted-foreground">
              Local network IP of your Xbox console
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Xbox Live API Key</label>
            <Input 
              type="password"
              placeholder="Enter your Xbox API key" 
              value={key} 
              onChange={(e) => setKey(e.target.value)}
              className={key.trim().length > 0 && key.trim().length < 20 ? "border-destructive" : ""}
            />
            <p className="text-xs text-muted-foreground">
              API key for Xbox Live profile verification
            </p>
          </div>
        </div>

        <Button 
          onClick={onConfigure} 
          disabled={!valid || busy}
          className="w-full"
          size="lg"
        >
          {busy ? "Configuring…" : "Configure for Automation"}
        </Button>

        {!!err && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
            <span className="text-sm text-destructive">{err}</span>
          </div>
        )}

        {steps.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Configuration Steps</h4>
            <div className="space-y-2">
              {steps.map((s, i) => (
                <div 
                  key={i} 
                  className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg text-sm"
                >
                  {s.ok ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  )}
                  <span className="font-medium capitalize">
                    {s.step.replace(/_/g, ' ')}
                  </span>
                  <span className="text-muted-foreground">{s.detail}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}