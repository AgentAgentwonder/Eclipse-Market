import React, { useEffect, useMemo, useState } from 'react';
import App from './App';
import { MobileApp } from './mobile/MobileApp';

const MOBILE_BREAKPOINT = 768;

const isMobileViewport = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  const userAgent = window.navigator.userAgent || '';
  const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    userAgent
  );
  const isSmallViewport = window.innerWidth <= MOBILE_BREAKPOINT;
  const searchParams = new URLSearchParams(window.location.search);
  const forceMobile = searchParams.get('mobile') === '1';
  const forceDesktop = searchParams.get('desktop') === '1';

  if (forceDesktop) {
    return false;
  }

  if (forceMobile) {
    return true;
  }

  return isMobileUserAgent || isSmallViewport;
};

export const ResponsiveRoot: React.FC = () => {
  const [mobile, setMobile] = useState<boolean>(() => isMobileViewport());

  useEffect(() => {
    const handleResize = () => {
      setMobile(isMobileViewport());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const content = useMemo(() => {
    if (mobile) {
      return <MobileApp />;
    }

    return <App />;
  }, [mobile]);

  return content;
};
