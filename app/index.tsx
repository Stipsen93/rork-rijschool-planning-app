import { useEffect } from "react";
import { useRouter } from "expo-router";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useAuth } from "@/components/auth/AuthStore";

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('[Index] State:', { isLoading, isAuthenticated });
    
    if (isLoading) {
      console.log('[Index] Still loading, waiting...');
      return;
    }

    console.log('[Index] Not loading anymore, navigating...');
    
    if (isAuthenticated) {
      console.log('[Index] User is authenticated, going to /overview');
      router.replace('/(tabs)/overview');
    } else {
      console.log('[Index] User not authenticated, going to /login');
      router.replace('/login');
    }
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
