import { useState, useEffect } from 'react';

export default function useMarketStatus() {
  const [isMarketOpen, setIsMarketOpen] = useState(false);

  useEffect(() => {
    const checkStatus = () => {
      // Create a date object in IST timezone
      const istTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const day = istTime.getDay();
      const timeInMinutes = istTime.getHours() * 60 + istTime.getMinutes();
      
      // Market is open Monday (1) to Friday (5) from 09:15 to 15:30 (555 to 930 mins)
      const isOpen = day >= 1 && day <= 5 && timeInMinutes >= 555 && timeInMinutes < 930;
      setIsMarketOpen(isOpen);
    };

    checkStatus();
    const interval = setInterval(checkStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  return isMarketOpen;
}
