import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLogin } from './components/AdminLogin';
import { LandingPage } from './components/LandingPage';
import { BOOTSTRAPPED_ADMIN_EMAIL, auth, db } from './lib/firebase';

function isAdminUrl(): boolean {
  const hash = window.location.hash.toLowerCase();
  return (
    hash === '#admin' ||
    hash.startsWith('#admin/') ||
    hash.startsWith('#admin?') ||
    window.location.pathname.startsWith('/admin') ||
    window.location.search.includes('view=admin')
  );
}

export default function App() {
  const [route, setRoute] = useState<'landing' | 'admin'>(() =>
    isAdminUrl() ? 'admin' : 'landing'
  );

  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAuthorizedAdmin, setIsAuthorizedAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(false);

  useEffect(() => {
    function handleUrlChange() {
      setRoute(isAdminUrl() ? 'admin' : 'landing');
    }
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);

      if (!nextUser) {
        setIsAuthorizedAdmin(false);
        setCheckingRole(false);
        return;
      }

      setCheckingRole(true);
      try {
        const isBootstrapped =
          Boolean(nextUser.emailVerified) &&
          nextUser.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase();

        if (isBootstrapped) {
          setIsAuthorizedAdmin(true);
        } else {
          const adminDoc = await getDoc(doc(db, 'admins', nextUser.uid));
          setIsAuthorizedAdmin(Boolean(nextUser.emailVerified && adminDoc.exists()));
        }
      } catch {
        setIsAuthorizedAdmin(false);
      } finally {
        setCheckingRole(false);
      }
    });

    return () => unsub();
  }, []);

  function navigateTo(nextRoute: 'landing' | 'admin') {
    const targetPath = nextRoute === 'admin' ? '/#admin' : '/';
    window.history.pushState({}, '', targetPath);
    setRoute(nextRoute);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  if (route === 'admin') {
    if (!authReady || checkingRole || !user || !isAuthorizedAdmin) {
      return (
        <AdminLogin
          currentUser={user}
          isAuthorizedAdmin={isAuthorizedAdmin}
          checkingRole={!authReady || checkingRole}
          onBackToSite={() => navigateTo('landing')}
        />
      );
    }

    return <AdminDashboard user={user} onViewSite={() => navigateTo('landing')} />;
  }

  return <LandingPage />;
}
