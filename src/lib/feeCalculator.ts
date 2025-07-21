interface FeeCalculation {
  depositAmount: number;
  platformFee: number;
  platformFeePercentage: number;
  totalCharge: number;
  amountToWallet: number;
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