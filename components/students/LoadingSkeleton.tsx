import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Platform, StyleSheet, View } from "react-native";

export function LoadingSkeleton() {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: Platform.OS !== "web" }),
        Animated.timing(opacity, { toValue: 0.3, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: Platform.OS !== "web" }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <View style={{ gap: 12 }} testID="students-loading-skeleton">
      {Array.from({ length: 8 }).map((_, idx) => (
        <View key={`sk-${idx}`} style={styles.card}>
          <Animated.View style={[styles.avatar, { opacity }]} />
          <View style={{ flex: 1, gap: 8 }}>
            <Animated.View style={[styles.line, { width: 180, opacity }]} />
            <Animated.View style={[styles.lineSm, { width: 140, opacity }]} />
            <Animated.View style={[styles.lineSm, { width: 100, opacity }]} />
          </View>
          <Animated.View style={[styles.dot, { opacity }]} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: Platform.OS === "web" ? 0 : 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#e5e7eb" },
  line: { height: 16, borderRadius: 4, backgroundColor: "#e5e7eb" },
  lineSm: { height: 12, borderRadius: 4, backgroundColor: "#e5e7eb" },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#e5e7eb" },
});