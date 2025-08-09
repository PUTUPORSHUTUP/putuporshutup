import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Gamepad2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface VerifyXboxProfileProps {
  gamertag?: string;
  onVerified?: (data: { xuid: string; gamertag: string }) => void;
}

export function VerifyXboxProfile({ gamertag: initialGamertag = "", onVerified }: VerifyXboxProfileProps) {
  const [gamertag, setGamertag] = useState(initialGamertag);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ok: boolean; text: string} | null>(null);
  const { toast } = useToast();

  async function onVerify() {
    if (!gamertag.trim()) {
      setMsg({ ok: false, text: "Please enter a gamertag" });
      return;
    }

    setBusy(true); 
    setMsg(null);
    
    try {
      console.log(`🎮 Verifying Xbox profile: ${gamertag}`);
      
      const { data, error } = await supabase.functions.invoke('xbl_verify_profile', {
        body: { gamertag: gamertag.trim() }
      });
      
      if (error) {
        console.error('❌ Verification function error:', error);
        throw new Error(error.message || "Verification service unavailable");
      }

      if (!data.ok) {
        console.error('❌ Verification failed:', data.error);
        throw new Error(data.error || "Verification failed");
      }

      // Success case
      console.log('✅ Profile verified:', data);
      const successMessage = `Verified as XUID ${data.xuid}`;
      setMsg({ ok: true, text: successMessage });
      
      toast({
        title: "Profile Verified",
        description: `Successfully verified ${data.gamertag}`,
      });

      onVerified?.({ xuid: data.xuid, gamertag: data.gamertag });

    } catch (e: any) {
      console.error('💥 Verification error:', e);
      const errorMessage = e.message || "Verification failed";
      setMsg({ ok: false, text: errorMessage });
      
      toast({
        title: "Verification Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gamepad2 className="h-5 w-5 text-primary" />
          Verify Xbox Profile
        </CardTitle>
        <CardDescription>
          Verify a gamertag against Xbox Live API
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter gamertag"
            value={gamertag}
            onChange={(e) => setGamertag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onVerify()}
            className="flex-1"
          />
          <Button 
            onClick={onVerify} 
            disabled={busy || !gamertag.trim()}
            size="icon"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>

        <Button 
          onClick={onVerify} 
          disabled={busy || !gamertag.trim()}
          className="w-full"
        >
          {busy ? "Verifying…" : "Verify Profile"}
        </Button>

        {msg && (
          <div className={`flex items-center gap-2 p-3 rounded-lg border ${
            msg.ok 
              ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
              : "bg-destructive/10 border-destructive/20 text-destructive"
          }`}>
            {msg.ok ? (
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 flex-shrink-0" />
            )}
            <span className="text-sm font-medium">{msg.text}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}