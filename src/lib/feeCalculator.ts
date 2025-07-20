interface FeeCalculation {
  depositAmount: number;
  platformFee: number;
  platformFeePercentage: number;
  totalCharge: number;
  amountToWallet: number;
  isPremium: boolean;
}

export const calculateDepositFee = (amount: number, isPremium: boolean = false): FeeCalculation => {
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
  
  // Premium members get 50% fee reduction
  if (isPremium) {
    feePercentage = feePercentage * 0.5;
  }
  
  const platformFee = Math.round((amount * (feePercentage / 100)) * 100) / 100;
  const totalCharge = amount + platformFee;
  
  return {
    depositAmount: amount,
    platformFee,
    platformFeePercentage: feePercentage,
    totalCharge,
    amountToWallet: amount,
    isPremium
  };
};

export const getFeeStructure = () => [
  { range: "$1 - $50", fee: "6%", premiumFee: "3%" },
  { range: "$51 - $200", fee: "4%", premiumFee: "2%" },
  { range: "$201 - $500", fee: "3%", premiumFee: "1.5%" },
  { range: "$500+", fee: "2%", premiumFee: "1%" }
];

export const PREMIUM_MONTHLY_COST = 9.99;