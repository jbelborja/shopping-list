import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input } from '@/components/ui';
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
    <SafeAreaView className="flex-1 bg-slate-950">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          className="px-5 py-10"
        >
          <View className="max-w-md w-full mx-auto bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-black/40">
            {/* Logo / Header */}
            <View className="items-center mb-8">
              <View className="w-16 h-16 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 items-center justify-center mb-4 shadow-inner">
                <Ionicons name="cart" size={32} color="#818CF8" />
              </View>
              <Text className="text-white text-2xl font-black tracking-tight text-center">
                Shopping List
              </Text>
              <Text className="text-slate-400 text-sm mt-1 text-center">
                {isSignUp
                  ? 'Create an account to collaborate on lists'
                  : 'Welcome back! Sign in to sync your lists'}
              </Text>
            </View>

            {/* Error Message */}
            {(error || googleError) && (
              <View className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3.5 mb-5 flex-row items-center">
                <Ionicons name="alert-circle" size={18} color="#F43F5E" />
                <Text className="text-rose-400 text-xs ml-2.5 flex-1 leading-4">
                  {error || googleError}
                </Text>
              </View>
            )}

            {/* Form Fields */}
            {isSignUp && (
              <Input
                label="Full Name"
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="e.g. Alex Smith"
                leftIcon={<Ionicons name="person-outline" size={18} color="#64748B" />}
              />
            )}

            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="alex@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Ionicons name="mail-outline" size={18} color="#64748B" />}
            />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              leftIcon={<Ionicons name="lock-closed-outline" size={18} color="#64748B" />}
            />

            {/* Submit Button */}
            <Button
              title={isSignUp ? 'Create Account' : 'Sign In'}
              onPress={handleEmailAuth}
              loading={loading}
              disabled={googleLoading}
              variant="primary"
              size="lg"
              className="w-full mt-2"
            />

            {/* Divider */}
            <View className="flex-row items-center my-5">
              <View className="flex-1 h-[1px] bg-slate-800" />
              <Text className="text-slate-500 text-xs px-3 uppercase tracking-wider font-medium">or</Text>
              <View className="flex-1 h-[1px] bg-slate-800" />
            </View>

            {/* Google Sign In */}
            <Button
              title="Continue with Google"
              onPress={handleGoogleSignIn}
              loading={googleLoading}
              disabled={loading}
              variant="outline"
              size="md"
              leftIcon={<Ionicons name="logo-google" size={18} color="#818CF8" />}
              className="w-full border-slate-700 bg-slate-800/40 hover:bg-slate-800"
            />

            {/* Toggle Sign Up / Sign In */}
            <View className="flex-row items-center justify-center mt-6 pt-4 border-t border-slate-800/60">
              <Text className="text-slate-400 text-xs mr-1.5">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              </Text>
              <Pressable onPress={() => setIsSignUp(!isSignUp)} hitSlop={8}>
                <Text className="text-indigo-400 font-bold text-xs hover:underline">
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
