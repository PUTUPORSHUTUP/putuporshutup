import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface QRCodeGeneratorProps {
  value: string;
  size?: number;
  className?: string;
}

export const QRCodeGenerator = ({ value, size = 200, className = "" }: QRCodeGeneratorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    }
  }, [value, size]);

  return (
    <canvas 
      ref={canvasRef} 
      className={`border rounded-lg ${className}`}
    />
  );
};

// Helper function to generate payment URLs
export const generatePaymentURL = (
  type: 'cashapp' | 'paypal' | 'venmo',
  identifier: string,
  amount?: number,
  note?: string
) => {
  switch (type) {
    case 'cashapp':
      // Cash App URL format: https://cash.app/$[cashtag]
      const cashAppUrl = `https://cash.app/${identifier}`;
      return amount ? `${cashAppUrl}/${amount}` : cashAppUrl;
      
    case 'paypal':
      // PayPal.me URL format: https://paypal.me/[username]/[amount]
      let paypalUrl = `https://paypal.me/${identifier}`;
      if (amount) paypalUrl += `/${amount}`;
      if (note) paypalUrl += `?note=${encodeURIComponent(note)}`;
      return paypalUrl;
      
    case 'venmo':
      // Venmo URL format: https://venmo.com/[username]
      let venmoUrl = `https://venmo.com/${identifier}`;
      if (amount || note) {
        const params = new URLSearchParams();
        if (amount) params.append('amount', amount.toString());
        if (note) params.append('note', note);
        venmoUrl += `?${params.toString()}`;
      }
      return venmoUrl;
      
    default:
      return '';
  }
};