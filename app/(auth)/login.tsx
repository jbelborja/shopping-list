import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signInWithEmail, signUpWithEmail, useGoogleAuth } from '@/lib/auth';

export default function LoginScreen() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { signIn: signInWithGoogle, loading: googleLoading, error: googleError } = useGoogleAuth();

  const handleEmailAuth = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    if (isSignUp && !displayName.trim()) {
      setError('Please provide your name.');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, displayName);
      } else {
        await signInWithEmail(email, password);
      }
      router.replace('/');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      const user = await signInWithGoogle();
      if (user) {
        router.replace('/');
      }
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#1A1A2E]">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          className="px-6 py-8"
        >
          <View className="max-w-md w-full mx-auto bg-[#16213E] border border-[#2E3D60] rounded-3xl p-8 shadow-2xl">
            {/* Header / Brand */}
            <View className="items-center mb-8">
              <View className="w-16 h-16 rounded-2xl bg-accent/20 border border-accent/40 items-center justify-center mb-4">
                <Ionicons name="cart" size={32} color="#E94560" />
              </View>
              <Text className="text-white text-2xl font-black tracking-tight text-center">
                Shopping List
              </Text>
              <Text className="text-gray-400 text-sm mt-1 text-center">
                {isSignUp
                  ? 'Create an account to sync your lists'
                  : 'Sign in to access your shopping lists'}
              </Text>
            </View>

            {/* Error Message */}
            {(error || googleError) && (
              <View className="bg-red-500/15 border border-red-500/30 rounded-xl p-3 mb-5 flex-row items-center">
                <Ionicons name="alert-circle" size={18} color="#EF4444" />
                <Text className="text-red-400 text-xs ml-2 flex-1">
                  {error || googleError}
                </Text>
              </View>
            )}

            {/* Form Fields */}
            {isSignUp && (
              <View className="mb-4">
                <Text className="text-gray-300 text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Your Name
                </Text>
                <TextInput
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="e.g. Alex"
                  placeholderTextColor="#64748B"
                  className="bg-[#1A1A2E] border border-[#2E3D60] text-white px-4 py-3 rounded-xl font-normal"
                />
              </View>
            )}

            <View className="mb-4">
              <Text className="text-gray-300 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Email
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="name@example.com"
                placeholderTextColor="#64748B"
                keyboardType="email-address"
                autoCapitalize="none"
                className="bg-[#1A1A2E] border border-[#2E3D60] text-white px-4 py-3 rounded-xl font-normal"
              />
            </View>

            <View className="mb-6">
              <Text className="text-gray-300 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Password
              </Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#64748B"
                secureTextEntry
                className="bg-[#1A1A2E] border border-[#2E3D60] text-white px-4 py-3 rounded-xl font-normal"
              />
            </View>

            {/* Submit Button */}
            <Pressable
              onPress={handleEmailAuth}
              disabled={loading || googleLoading}
              className={`bg-accent py-3.5 rounded-xl items-center mb-4 active:bg-accentHover shadow-md ${
                loading ? 'opacity-70' : ''
              }`}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white font-bold text-base">
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </Text>
              )}
            </Pressable>

            {/* Divider */}
            <View className="flex-row items-center my-4">
              <View className="flex-1 h-[1px] bg-[#2E3D60]" />
              <Text className="text-gray-400 text-xs px-3 uppercase tracking-wider">or</Text>
              <View className="flex-1 h-[1px] bg-[#2E3D60]" />
            </View>

            {/* Google Sign In */}
            <Pressable
              onPress={handleGoogleSignIn}
              disabled={loading || googleLoading}
              className="bg-[#1A1A2E] border border-[#2E3D60] py-3 rounded-xl flex-row items-center justify-center mb-6 active:bg-white/5"
            >
              {googleLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="logo-google" size={18} color="#FFFFFF" />
                  <Text className="text-white font-semibold text-sm ml-2.5">
                    Continue with Google
                  </Text>
                </>
              )}
            </Pressable>

            {/* Toggle Sign Up / Sign In */}
            <View className="flex-row items-center justify-center">
              <Text className="text-gray-400 text-xs mr-1">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              </Text>
              <Pressable onPress={() => setIsSignUp(!isSignUp)} hitSlop={8}>
                <Text className="text-accent font-bold text-xs">
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
