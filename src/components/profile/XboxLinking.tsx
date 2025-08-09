import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Search, Gamepad2, Link, Trophy, CheckCircle2, XCircle } from 'lucide-react';

interface XboxProfile {
  gamertag: string;
  xuid: string;
  profilePictureUrl: string;
  gamerScore: number;
  isPublic: boolean;
}

interface XboxLinkingProps {
  onProfileLinked?: (profile: XboxProfile) => void;
}

export function XboxLinking({ onProfileLinked }: XboxLinkingProps) {
  const [gamertag, setGamertag] = useState('');
  const [searchResults, setSearchResults] = useState<XboxProfile | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ok: boolean; text: string} | null>(null);
  const { toast } = useToast();

  const searchGamertag = async () => {
    if (!gamertag.trim()) {
      toast({
        title: "Enter a gamertag",
        description: "Please enter a valid Xbox gamertag to search",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setSearchResults(null);
    setVerificationResult(null);
    
    try {
      console.log(`🔍 Searching for gamertag: ${gamertag.trim()}`);
      
      // Use the new bulletproof verification system
      const { data, error } = await supabase.functions.invoke('xbl_verify_profile', {
        body: { gamertag: gamertag.trim() }
      });

      if (error) {
        console.error('❌ Verification service error:', error);
        throw new Error(error.message || 'Verification service unavailable');
      }

      if (!data.ok) {
        console.error('❌ Profile verification failed:', data.error);
        setVerificationResult({ ok: false, text: data.error || "Could not verify this Xbox gamertag" });
        toast({
          title: "Gamertag not found",
          description: data.error || "Could not find this Xbox gamertag",
          variant: "destructive",
        });
        return;
      }

      // Success - create profile object
      const profile: XboxProfile = {
        gamertag: data.gamertag,
        xuid: data.xuid,
        profilePictureUrl: '', // Will be populated from Xbox API if available
        gamerScore: 0, // Will be populated from Xbox API if available
        isPublic: true
      };

      setSearchResults(profile);
      setVerificationResult({ ok: true, text: `Verified as XUID ${data.xuid}` });
      
      toast({
        title: "Gamertag verified!",
        description: `Successfully verified ${data.gamertag}`,
      });

    } catch (error) {
      console.error('💥 Search error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to search for gamertag';
      setVerificationResult({ ok: false, text: errorMessage });
      toast({
        title: "Search failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const linkProfile = async () => {
    if (!searchResults) return;

    setIsLinking(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be logged in to link Xbox profile');
      }

      const { data, error } = await supabase.functions.invoke('xbox-profile-integration', {
        body: {
          action: 'link_profile',
          gamertag: searchResults.gamertag,
          xuid: searchResults.xuid
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to link Xbox profile');
      }

      if (data.success) {
        toast({
          title: "Xbox profile linked!",
          description: `Successfully linked ${data.profile.gamertag} to your account`,
        });
        onProfileLinked?.(data.profile);
        setSearchResults(null);
        setGamertag('');
      } else {
        throw new Error(data.error || 'Failed to link Xbox profile');
      }
    } catch (error) {
      console.error('Linking error:', error);
      toast({
        title: "Linking failed",
        description: error instanceof Error ? error.message : "Failed to link Xbox profile",
        variant: "destructive",
      });
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gamepad2 className="h-5 w-5 text-green-600" />
          Link Xbox Profile
        </CardTitle>
        <CardDescription>
          Connect your Xbox gamertag to unlock skill-based matchmaking and automated stat verification
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter Xbox gamertag"
            value={gamertag}
            onChange={(e) => setGamertag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchGamertag()}
          />
          <Button 
            onClick={searchGamertag} 
            disabled={isSearching}
            size="icon"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {verificationResult && (
          <div className={`flex items-center gap-2 p-3 rounded-lg border text-sm ${
            verificationResult.ok 
              ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
              : "bg-destructive/10 border-destructive/20 text-destructive"
          }`}>
            {verificationResult.ok ? (
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 flex-shrink-0" />
            )}
            <span className="font-medium">{verificationResult.text}</span>
          </div>
        )}

        {searchResults && (
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage 
                    src={searchResults.profilePictureUrl} 
                    alt={searchResults.gamertag}
                  />
                  <AvatarFallback>
                    <Gamepad2 className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{searchResults.gamertag}</h3>
                    <Badge variant={searchResults.isPublic ? "default" : "secondary"}>
                      {searchResults.isPublic ? "Public" : "Private"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Trophy className="h-3 w-3" />
                    {searchResults.gamerScore.toLocaleString()} GamerScore
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={linkProfile} 
                disabled={isLinking}
                className="w-full mt-3"
                size="sm"
              >
                <Link className="h-4 w-4 mr-2" />
                {isLinking ? "Linking..." : "Link This Profile"}
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="text-xs text-muted-foreground">
          <p>• Your Xbox profile must be set to public for verification</p>
          <p>• Linking enables automatic stat verification for challenges</p>
          <p>• You can unlink your profile anytime in settings</p>
        </div>
      </CardContent>
    </Card>
  );
}