import { supabase } from '@/integrations/supabase/client';

export interface WalletValidationResult {
  isValid: boolean;
  currentBalance: number;
  requiredAmount: number;
  shortfall: number;
  message: string;
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