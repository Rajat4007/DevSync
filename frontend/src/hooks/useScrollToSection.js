import { useNavigate, useLocation } from 'react-router-dom';
import { useCallback, useEffect, useRef } from 'react';

export function useScrollToSection() {
  const navigate = useNavigate();
  const location = useLocation();
  const pendingScroll = useRef(null);

  useEffect(() => {
    if (location.pathname === '/' && pendingScroll.current) {
      const el = document.getElementById(pendingScroll.current);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.history.replaceState(null, '', '/');  
      }
      pendingScroll.current = null;
    }
  }, [location.pathname]);

  const scrollToSection = useCallback(
    (sectionId) => {
      if (location.pathname === '/') {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          window.history.replaceState(null, '', '/'); 
        }
      } else {
        pendingScroll.current = sectionId;
        navigate('/');
      }
    },
    [navigate, location.pathname]
  );

  return scrollToSection;
}