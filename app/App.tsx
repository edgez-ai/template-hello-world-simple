import React from "react";
import { SafeAreaView, StatusBar, StyleSheet, Text } from "react-native";

export default function App() {
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#f0f7ff" />
      <Text style={styles.title}>Hello World</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: "center",
    backgroundColor: "#f0f7ff",
    flex: 1,
    justifyContent: "center",
  },
  title: {
    color: "#102a43",
    fontSize: 52,
    fontWeight: "800",
    letterSpacing: -2,
  },
});
