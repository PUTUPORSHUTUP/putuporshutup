import { supabase } from '@/integrations/supabase/client';

export interface WalletValidationResult {
  isValid: boolean;
  currentBalance: number;
  requiredAmount: number;
  shortfall: number;
  message: string;
}

export interface MatchEligibility {
  canJoin1Dollar: boolean;
  canJoin3Dollar: boolean;
  canJoin5Dollar: boolean;
  canJoin10Dollar: boolean;
  availableMatches: number[];
  bannerMessage?: string;
  bannerType?: 'warning' | 'error';
}

/**
 * Validates if user has sufficient wallet balance for a given amount
 * @param userId - The user's ID
 * @param requiredAmount - The amount needed (entry fee, stake, etc.)
 * @returns Validation result with balance information
 */
export async function validateWalletBalance(
  userId: string, 
  requiredAmount: number
): Promise<WalletValidationResult> {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('wallet_balance')
      .eq('user_id', userId)
      .single();

    if (error || !profile) {
      return {
        isValid: false,
        currentBalance: 0,
        requiredAmount,
        shortfall: requiredAmount,
        message: 'Unable to verify wallet balance. Please try again.'
      };
    }

    const currentBalance = profile.wallet_balance || 0;
    const isValid = currentBalance >= requiredAmount;
    const shortfall = Math.max(0, requiredAmount - currentBalance);

    return {
      isValid,
      currentBalance,
      requiredAmount,
      shortfall,
      message: isValid 
        ? 'Sufficient funds available'
        : `Insufficient funds. Need $${shortfall.toFixed(2)} more (Balance: $${currentBalance.toFixed(2)}, Required: $${requiredAmount.toFixed(2)})`
    };
  } catch (error) {
    console.error('Wallet validation error:', error);
    return {
      isValid: false,
      currentBalance: 0,
      requiredAmount,
      shortfall: requiredAmount,
      message: 'Failed to check wallet balance. Please try again.'
    };
  }
}

/**
 * PUOSU Wallet System - Dynamic Match Eligibility Calculator
 * Implements the tiered balance system for match access
 */
export function calculateMatchEligibility(balance: number): MatchEligibility {
  const canJoin1Dollar = balance >= 1;
  const canJoin3Dollar = balance >= 3;
  const canJoin5Dollar = balance >= 5;
  const canJoin10Dollar = balance >= 10;
  
  const availableMatches: number[] = [];
  if (canJoin1Dollar) availableMatches.push(1);
  if (canJoin3Dollar) availableMatches.push(3);
  if (canJoin5Dollar) availableMatches.push(5);
  if (canJoin10Dollar) availableMatches.push(10);
  
  let bannerMessage: string | undefined;
  let bannerType: 'warning' | 'error' | undefined;
  
  if (balance === 0) {
    bannerMessage = "🚨 Balance empty. Top up to compete again.";
    bannerType = 'error';
  } else if (balance < 5 && balance >= 1) {
    bannerMessage = "⚠️ Low balance: only $1 matches available until you top up.";
    bannerType = 'warning';
  }
  
  return {
    canJoin1Dollar,
    canJoin3Dollar,
    canJoin5Dollar,
    canJoin10Dollar,
    availableMatches,
    bannerMessage,
    bannerType
  };
}

/**
 * Hook-like function to get wallet balance validation with toast integration
 */
export function createWalletValidator(toast: any, user: any) {
  return async (requiredAmount: number): Promise<WalletValidationResult> => {
    if (!user) {
      const result: WalletValidationResult = {
        isValid: false,
        currentBalance: 0,
        requiredAmount,
        shortfall: requiredAmount,
        message: 'Please log in to continue'
      };
      
      toast({
        title: "Authentication Required",
        description: result.message,
        variant: "destructive",
      });
      
      return result;
    }

    const validation = await validateWalletBalance(user.id, requiredAmount);
    
    if (!validation.isValid) {
      toast({
        title: "Insufficient Funds",
        description: validation.message,
        variant: "destructive",
      });
    }
    
    return validation;
  };
}