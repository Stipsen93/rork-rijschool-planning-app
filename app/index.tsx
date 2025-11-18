import { useEffect } from "react";
import { useRouter } from "expo-router";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useAuth } from "@/components/auth/AuthStore";

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      console.log('[Index] Still loading auth state...');
      return;
    }

    console.log('[Index] Auth loaded:', { isAuthenticated });
    
    const timeout = setTimeout(() => {
      if (isAuthenticated) {
        console.log('[Index] ✓ Redirecting to overview');
        router.replace('/(tabs)/overview');
      } else {
        console.log('[Index] ✗ Redirecting to login');
        router.replace('/login');
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, [isAuthenticated, isLoading, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2563EB" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
});
