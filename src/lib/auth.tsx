import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { db, ensureAuth } from './firebase';
import { collection, getDocs, query, where, doc, getDoc, setDoc } from 'firebase/firestore';
import { User, AdminConfig } from '../types';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loginUser: (username: string, accessCode: string) => Promise<boolean>;
  loginAdmin: (adminCode: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initSession = async () => {
      const storedSession = localStorage.getItem('app_session');
      if (storedSession) {
        const parsedUser = JSON.parse(storedSession) as User;
        setUser(parsedUser);
        setLoading(false); // Make UI render immediately
        
        try {
          const fbUser = await ensureAuth();
          const uid = fbUser!.uid;
          
          if (parsedUser.role === 'admin' && parsedUser.accessCode) {
            // Re-elevate anonymous session to admin using stored code
            await setDoc(doc(db, 'admins', uid), { adminCode: parsedUser.accessCode });
          } else if (parsedUser.role === 'student' && parsedUser.accessCode && parsedUser.id) {
             // Re-bind student session
             await setDoc(doc(db, 'authMap', uid), {
               studentId: parsedUser.id,
               accessCode: parsedUser.accessCode
             });
          }
        } catch (e) {
          console.error("Session rehydration error:", e);
        }
      } else {
        setLoading(false);
      }
    };
    initSession();
  }, []);

  const loginUser = async (username: string, accessCode: string) => {
    try {
      const fbUser = await ensureAuth();
      const uid = fbUser!.uid;

      const q = query(
        collection(db, 'users'),
        where('username', '==', username),
        where('accessCode', '==', accessCode)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        const userData = { id: docSnap.id, ...docSnap.data() } as User;
        
        // Securely bind this anonymous uid to the student id via authMap
        await setDoc(doc(db, 'authMap', uid), {
          studentId: docSnap.id,
          accessCode: accessCode
        });
        
        setUser(userData);
        localStorage.setItem('app_session', JSON.stringify(userData));
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const loginAdmin = async (adminCode: string) => {
    try {
      const fbUser = await ensureAuth();
      const uid = fbUser!.uid;
      const configRef = doc(db, 'adminConfig', 'main');

      // Attempt to immediately elevate to admin if config exists
      try {
        await setDoc(doc(db, 'admins', uid), { adminCode });
      } catch (err) {
        // May fail if config doesn't exist yet or if wrong code, we'll verify.
      }

      const configDoc = await getDoc(configRef);
      
      let config: AdminConfig;

      if (!configDoc.exists()) {
        if (adminCode !== '777888') {
          throw new Error("Dastlabki admin kodi '777888' bo'lishi kerak");
        }
        config = {
          centerName: "Wissen O'quv Markazi",
          adminPhone: "+998901234567",
          adminCode: "777888",
          eskizEmail: "",
          eskizPassword: "",
          smsEnabled: false
        };
        // Auto-bootstrap
        await setDoc(configRef, config);
        // Elevate to admin after bootstrap
        await setDoc(doc(db, 'admins', uid), { adminCode });
      } else {
        config = configDoc.data() as AdminConfig;
        
        let needsUpdate = false;
        
        // Force reset the code to 777888 if it was something else and user supplied 777888
        if (adminCode === '777888' && config.adminCode !== '777888') {
          config.adminCode = '777888';
          needsUpdate = true;
        }
        
        if (config.centerName !== "Wissen O'quv Markazi") {
          config.centerName = "Wissen O'quv Markazi";
          needsUpdate = true;
        }

        if (needsUpdate) {
          await setDoc(configRef, config);
        }
        
        if (config.adminCode === adminCode) {
          await setDoc(doc(db, 'admins', uid), { adminCode });
        }
      }

      if (config.adminCode === adminCode) {
        const adminUser: User = {
          id: 'admin_virtual_id',
          username: 'admin',
          accessCode: adminCode,
          fullName: 'Administrator',
          phone: config.adminPhone,
          role: 'admin',
          groupId: '',
          createdAt: Date.now()
        };
        setUser(adminUser);
        localStorage.setItem('app_session', JSON.stringify(adminUser));
        return true;
      }
      return false;
    } catch (e: any) {
      console.error(e);
      throw e;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('app_session');
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin: user?.role === 'admin', loginUser, loginAdmin, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

