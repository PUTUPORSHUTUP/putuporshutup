interface FeeCalculation {
  depositAmount: number;
  platformFee: number;
  platformFeePercentage: number;
  totalCharge: number;
  amountToWallet: number;
  membershipTier: 'none' | 'basic' | 'premium';
}

interface ChallengeFeeCalculation {
  challengeAmount: number;
  platformFee: number;
  platformFeePercentage: number;
  totalToWinner: number;
  membershipTier: 'none' | 'basic' | 'premium';
}

export const calculateDepositFee = (amount: number, membershipTier: 'none' | 'basic' | 'premium' = 'none'): FeeCalculation => {
  let feePercentage = 0;
  
  // Tiered fee structure
  if (amount <= 50) {
    feePercentage = 6; // 6% for small deposits
  } else if (amount <= 200) {
    feePercentage = 4; // 4% for medium deposits  
  } else if (amount <= 500) {
    feePercentage = 3; // 3% for large deposits
  } else {
    feePercentage = 2; // 2% for VIP deposits
  }
  
  // Apply membership discounts
  if (membershipTier === 'basic') {
    feePercentage = feePercentage * 0.5; // 50% fee reduction for basic ($9.99)
  } else if (membershipTier === 'premium') {
    feePercentage = 0; // No fees for premium ($19.99)
  }
  
  const platformFee = Math.round((amount * (feePercentage / 100)) * 100) / 100;
  const totalCharge = amount + platformFee;
  
  return {
    depositAmount: amount,
    platformFee,
    platformFeePercentage: feePercentage,
    totalCharge,
    amountToWallet: amount,
    membershipTier
  };
};

export const getFeeStructure = () => [
  { range: "$1 - $50", fee: "6%", basicFee: "3%", premiumFee: "0%" },
  { range: "$51 - $200", fee: "4%", basicFee: "2%", premiumFee: "0%" },
  { range: "$201 - $500", fee: "3%", basicFee: "1.5%", premiumFee: "0%" },
  { range: "$500+", fee: "2%", basicFee: "1%", premiumFee: "0%" }
];

export const BASIC_MONTHLY_COST = 9.99;
export const PREMIUM_MONTHLY_COST = 19.99;

// Challenge fee calculation with 6% platform fee
export const calculateChallengeFee = (challengeAmount: number, membershipTier: 'none' | 'basic' | 'premium' = 'none'): ChallengeFeeCalculation => {
  let feePercentage = 6; // 6% platform fee for challenges
  
  // Apply membership discounts
  if (membershipTier === 'basic') {
    feePercentage = feePercentage * 0.5; // 50% fee reduction for basic
  } else if (membershipTier === 'premium') {
    feePercentage = 0; // No fees for premium
  }
  
  const platformFee = Math.round((challengeAmount * (feePercentage / 100)) * 100) / 100;
  const totalToWinner = challengeAmount - platformFee;
  
  return {
    challengeAmount,
    platformFee,
    platformFeePercentage: feePercentage,
    totalToWinner,
    membershipTier
  };
};

// Timeout handling for challenges (auto-refund after 24 hours)
export const CHALLENGE_TIMEOUT_HOURS = 24;
export const isChallengePastTimeout = (createdAt: string): boolean => {
  const timeoutThreshold = new Date();
  timeoutThreshold.setHours(timeoutThreshold.getHours() - CHALLENGE_TIMEOUT_HOURS);
  return new Date(createdAt) < timeoutThreshold;
};