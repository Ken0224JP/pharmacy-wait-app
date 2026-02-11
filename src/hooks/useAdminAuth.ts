import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, signOut, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { AUTH_DOMAIN_SUFFIX } from "@/lib/constants";

export const useAdminAuth = (targetStoreId: string | null) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMismatch, setIsMismatch] = useState(false);
  const router = useRouter();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      // ログイン済みかつターゲット店舗IDが指定されている場合、整合性をチェック
      if (currentUser && targetStoreId) {
        // 定数を使ってドメイン部分（例: "@pharmacy.local"）を空文字に置換して削除
        const loggedInId = currentUser.email?.replace(AUTH_DOMAIN_SUFFIX, "") || "";
        
        setIsMismatch(loggedInId !== targetStoreId);
      } else {
        setIsMismatch(false);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, targetStoreId]);

  const logout = async () => {
    try {
      await signOut(auth);
      router.replace("/admin");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return { 
    user, 
    loading, 
    isMismatch, 
    logout 
  };
};