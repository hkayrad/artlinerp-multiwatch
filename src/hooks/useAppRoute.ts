import { useCallback, useEffect, useRef, useState } from 'react';

export type AppRoute = 'multiwatch' | 'fanart' | 'admin';

export function parseAppRoute(pathname: string): AppRoute {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  if (normalized === '/fanart') return 'fanart';
  if (normalized === '/admin') return 'admin';
  return 'multiwatch';
}

export function routeToPath(route: AppRoute): string {
  if (route === 'fanart') return '/fanart';
  if (route === 'admin') return '/admin';
  return '/';
}

export function useAppRoute() {
  const [route, setRoute] = useState<AppRoute>(() => {
    if (typeof window === 'undefined') return 'multiwatch';
    return parseAppRoute(window.location.pathname);
  });

  const savedMultiwatchSearchRef = useRef<string>(
    typeof window !== 'undefined' && parseAppRoute(window.location.pathname) === 'multiwatch'
      ? window.location.search
      : ''
  );

  useEffect(() => {
    const onPopState = () => {
      const next = parseAppRoute(window.location.pathname);
      if (next === 'multiwatch') {
        savedMultiwatchSearchRef.current = window.location.search;
      }
      setRoute(next);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback(
    (nextRoute: AppRoute) => {
      if (typeof window === 'undefined') {
        setRoute(nextRoute);
        return;
      }

      if (route === 'multiwatch' && nextRoute !== 'multiwatch') {
        savedMultiwatchSearchRef.current = window.location.search;
      }

      const targetPath = routeToPath(nextRoute);
      const targetUrl =
        nextRoute === 'multiwatch' && savedMultiwatchSearchRef.current
          ? `${targetPath}${savedMultiwatchSearchRef.current}`
          : targetPath;

      if (window.location.pathname + window.location.search !== targetUrl) {
        window.history.pushState({ route: nextRoute }, '', targetUrl);
      }
      setRoute(nextRoute);
    },
    [route]
  );

  return { route, navigate };
}
