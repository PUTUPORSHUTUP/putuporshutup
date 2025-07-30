import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Search, Gamepad2, Trophy, Users, Clock, ExternalLink } from 'lucide-react';

interface XboxProfile {
  gamertag: string;
  xuid: string;
  profilePictureUrl: string;
  gamerScore: number;
  isPublic: boolean;
  accountTier?: string;
}

interface LinkedUser {
  username: string;
  display_name: string;
  avatar_url: string;
  total_wins: number;
  total_losses: number;
  wallet_balance: number;
  xbox_linked_at: string;
}

export function AdminXboxSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [xboxProfile, setXboxProfile] = useState<XboxProfile | null>(null);
  const [linkedUser, setLinkedUser] = useState<LinkedUser | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const searchGamertag = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Enter a search term",
        description: "Please enter a gamertag to search",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setXboxProfile(null);
    setLinkedUser(null);

    try {
      // Search Xbox profile via OpenXBL
      const { data: xboxData, error: xboxError } = await supabase.functions.invoke('xbox-profile-integration', {
        body: {
          action: 'lookup_gamertag',
          gamertag: searchTerm.trim()
        }
      });

      if (xboxError) {
        throw new Error(xboxError.message || 'Failed to search Xbox profile');
      }

      if (xboxData.success) {
        setXboxProfile(xboxData.profile);
        
        // Check if this Xbox profile is linked to any user in our platform
        const { data: userProfile, error: userError } = await supabase
          .from('profiles')
          .select('username, display_name, avatar_url, total_wins, total_losses, wallet_balance, xbox_linked_at')
          .or(`xbox_gamertag.ilike.%${xboxData.profile.gamertag}%,xbox_xuid.eq.${xboxData.profile.xuid}`)
          .maybeSingle();

        if (!userError && userProfile) {
          setLinkedUser(userProfile);
        }

        toast({
          title: "Search completed",
          description: `Found Xbox profile: ${xboxData.profile.gamertag}`,
        });
      } else {
        toast({
          title: "Profile not found",
          description: "Could not find Xbox profile with that gamertag",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search failed",
        description: error instanceof Error ? error.message : "Failed to search for Xbox profile",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const verifyProfile = async () => {
    if (!xboxProfile) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('xbox-profile-integration', {
        body: {
          action: 'verify_gamertag',
          gamertag: xboxProfile.gamertag
        }
      });

      if (error) throw error;

      toast({
        title: data.isValid ? "Profile Verified" : "Verification Failed",
        description: data.isValid 
          ? `${xboxProfile.gamertag} is a valid Xbox profile`
          : "This Xbox profile could not be verified",
        variant: data.isValid ? "default" : "destructive"
      });
    } catch (error) {
      toast({
        title: "Verification Error",
        description: "Failed to verify Xbox profile",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Xbox Gamertag Search
        </CardTitle>
        <CardDescription>
          Search for any Xbox gamertag and view profile information. Check if profiles are linked to platform users.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Enter Xbox gamertag to search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchGamertag()}
            className="flex-1"
          />
          <Button onClick={searchGamertag} disabled={isSearching}>
            {isSearching ? (
              <>
                <Search className="h-4 w-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Search
              </>
            )}
          </Button>
        </div>

        {/* Xbox Profile Results */}
        {xboxProfile && (
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Gamepad2 className="h-5 w-5 text-green-600" />
                Xbox Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage 
                    src={xboxProfile.profilePictureUrl} 
                    alt={xboxProfile.gamertag}
                  />
                  <AvatarFallback>
                    <Gamepad2 className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold">{xboxProfile.gamertag}</h3>
                    <Badge variant={xboxProfile.isPublic ? "default" : "secondary"}>
                      {xboxProfile.isPublic ? "Public" : "Private"}
                    </Badge>
                    {xboxProfile.accountTier && (
                      <Badge variant="outline">{xboxProfile.accountTier}</Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-yellow-600" />
                      <span className="font-semibold">{xboxProfile.gamerScore.toLocaleString()}</span>
                      <span className="text-muted-foreground">GamerScore</span>
                    </div>
                    <div className="text-muted-foreground">
                      XUID: {xboxProfile.xuid}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="sm" onClick={verifyProfile}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Verify Profile
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Linked User Information */}
        {linkedUser && (
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Linked Platform User
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={linkedUser.avatar_url} alt={linkedUser.display_name} />
                  <AvatarFallback>
                    {linkedUser.display_name?.substring(0, 2).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <h4 className="font-semibold">{linkedUser.display_name || linkedUser.username}</h4>
                  <p className="text-sm text-muted-foreground">@{linkedUser.username}</p>
                  
                  <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                    <div>
                      <span className="font-semibold text-green-600">{linkedUser.total_wins}</span>
                      <span className="text-muted-foreground ml-1">Wins</span>
                    </div>
                    <div>
                      <span className="font-semibold text-red-600">{linkedUser.total_losses}</span>
                      <span className="text-muted-foreground ml-1">Losses</span>
                    </div>
                    <div>
                      <span className="font-semibold text-purple-600">${linkedUser.wallet_balance}</span>
                      <span className="text-muted-foreground ml-1">Balance</span>
                    </div>
                  </div>
                </div>

                <div className="text-right text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Linked {new Date(linkedUser.xbox_linked_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Instructions */}
        {!xboxProfile && !isSearching && (
          <div className="text-center text-muted-foreground">
            <Gamepad2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Enter an Xbox gamertag above to search for profile information</p>
            <p className="text-sm mt-1">You can search for any public Xbox Live profile</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}