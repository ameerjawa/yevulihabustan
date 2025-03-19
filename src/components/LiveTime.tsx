import React, { useState, useEffect } from 'react';

export default function LiveTime() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-end">
      <time dateTime={time.toISOString()} className="text-sm font-medium">
        {time.toLocaleTimeString('he-IL', { 
          timeZone: 'Asia/Jerusalem',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        })}
      </time>
      <time dateTime={time.toISOString()} className="text-xs text-gray-500">
        {time.toLocaleDateString('he-IL', {
          timeZone: 'Asia/Jerusalem',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}
      </time>
    </div>
  );
}