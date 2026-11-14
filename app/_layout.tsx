import '../global.css';

import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#1A1A2E" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#16213E',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: '#1A1A2E',
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'Shopping Lists',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="list/[id]"
          options={{
            title: 'List Details',
            headerBackTitle: 'Lists',
          }}
        />
        <Stack.Screen
          name="+not-found"
          options={{
            title: 'Not Found',
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
