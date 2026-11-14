import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ShoppingList } from '@/types';
import { Button, Input, Badge } from './ui';
import {
  shareListWithEmail,
  removeMemberFromList,
  leaveSharedList,
} from '@/lib/firestore';

interface ShareListModalProps {
  visible: boolean;
  onClose: () => void;
  list: ShoppingList | null;
  currentUserId: string;
  currentUserEmail?: string | null;
  onListLeft?: () => void;
}

export function ShareListModal({
  visible,
  onClose,
  list,
  currentUserId,
  currentUserEmail,
  onListLeft,
}: ShareListModalProps) {
  const [emailToShare, setEmailToShare] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [removingEmail, setRemovingEmail] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  if (!list) return null;

  const isOwner = list.ownerId === currentUserId;
  const ownerEmail = (list.ownerEmail || '').toLowerCase().trim();
  const currentEmailNorm = (currentUserEmail || '').toLowerCase().trim();

  // Combine members: always include ownerEmail first, followed by other members
  const rawMembers = list.memberEmails || [];
  const memberEmails = Array.from(
    new Set(
      [ownerEmail, ...rawMembers]
        .map((e) => e.toLowerCase().trim())
        .filter((e) => e.length > 0)
    )
  );

  const handleShare = async () => {
    const trimmed = emailToShare.trim().toLowerCase();
    setFeedback(null);

    if (!trimmed) {
      setFeedback({ type: 'error', message: 'Please enter an email address.' });
      return;
    }

    if (!trimmed.includes('@') || !trimmed.includes('.')) {
      setFeedback({ type: 'error', message: 'Please enter a valid email address.' });
      return;
    }

    if (trimmed === ownerEmail || trimmed === currentEmailNorm) {
      setFeedback({ type: 'error', message: 'You are already a member of this list.' });
      return;
    }

    if (memberEmails.includes(trimmed)) {
      setFeedback({ type: 'error', message: 'This user is already a member.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await shareListWithEmail(list.id, trimmed);
      setEmailToShare('');
      setFeedback({ type: 'success', message: res.message });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to share list.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const confirmRemove = (targetEmail: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Remove ${targetEmail} from this list?`)) {
        handleRemove(targetEmail);
      }
    } else {
      Alert.alert(
        'Remove Member',
        `Are you sure you want to remove ${targetEmail} from this list?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Remove', style: 'destructive', onPress: () => handleRemove(targetEmail) },
        ]
      );
    }
  };

  const handleRemove = async (targetEmail: string) => {
    setRemovingEmail(targetEmail);
    try {
      await removeMemberFromList(list.id, targetEmail);
      setFeedback({ type: 'success', message: `Removed ${targetEmail}` });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to remove member.',
      });
    } finally {
      setRemovingEmail(null);
    }
  };

  const confirmLeave = () => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Leave list "${list.name}"? It will no longer appear in your lists.`)) {
        handleLeave();
      }
    } else {
      Alert.alert(
        'Leave List',
        `Are you sure you want to leave "${list.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Leave', style: 'destructive', onPress: handleLeave },
        ]
      );
    }
  };

  const handleLeave = async () => {
    if (!currentUserEmail) return;
    try {
      await leaveSharedList(list.id, currentUserId, currentUserEmail);
      onClose();
      onListLeft?.();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to leave list.',
      });
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/80 px-4 py-8">
        <View className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-4 border-b border-slate-800">
            <View className="flex-row items-center space-x-3">
              <View className="w-10 h-10 rounded-xl bg-indigo-500/20 items-center justify-center border border-indigo-500/30">
                <Ionicons name="people" size={20} color="#818CF8" />
              </View>
              <View>
                <Text className="text-xl font-bold text-slate-100">Share List</Text>
                <Text className="text-xs text-slate-400" numberOfLines={1}>
                  {list.name}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={onClose}
              className="w-9 h-9 rounded-full bg-slate-800/80 items-center justify-center hover:bg-slate-700"
            >
              <Ionicons name="close" size={20} color="#94A3B8" />
            </Pressable>
          </View>

          {/* Feedback banner */}
          {feedback && (
            <View
              className={`mt-4 p-3 rounded-xl flex-row items-center space-x-2 border ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-rose-500/10 border-rose-500/30'
              }`}
            >
              <Ionicons
                name={feedback.type === 'success' ? 'checkmark-circle' : 'alert-circle'}
                size={18}
                color={feedback.type === 'success' ? '#34D399' : '#FB7185'}
              />
              <Text
                className={`text-xs flex-1 ${
                  feedback.type === 'success' ? 'text-emerald-300' : 'text-rose-300'
                }`}
              >
                {feedback.message}
              </Text>
            </View>
          )}

          {/* Add collaborator form (only owners can add, or all members can invite) */}
          <View className="mt-5">
            <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Invite by Email
            </Text>
            <View className="flex-row items-center space-x-2">
              <View className="flex-1">
                <Input
                  placeholder="collaborator@example.com"
                  value={emailToShare}
                  onChangeText={(t) => {
                    setEmailToShare(t);
                    if (feedback) setFeedback(null);
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  leftIcon="mail-outline"
                />
              </View>
              <View className="w-24">
                <Button
                  title="Invite"
                  onPress={handleShare}
                  loading={submitting}
                  disabled={submitting || !emailToShare.trim()}
                  variant="primary"
                  size="md"
                />
              </View>
            </View>
          </View>

          {/* Members List */}
          <View className="mt-6">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Members ({memberEmails.length})
              </Text>
            </View>

            <ScrollView className="max-h-56">
              <View className="space-y-2">
                {memberEmails.map((email) => {
                  const isThisOwner = email === ownerEmail;
                  const isCurrentUser = email === currentEmailNorm;
                  const isRemoving = removingEmail === email;

                  return (
                    <View
                      key={email}
                      className="flex-row items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80"
                    >
                      <View className="flex-row items-center space-x-3 flex-1 mr-2">
                        <View
                          className={`w-8 h-8 rounded-full items-center justify-center ${
                            isThisOwner
                              ? 'bg-amber-500/20 border border-amber-500/40'
                              : 'bg-indigo-500/20 border border-indigo-500/40'
                          }`}
                        >
                          <Ionicons
                            name={isThisOwner ? 'ribbon' : 'person'}
                            size={14}
                            color={isThisOwner ? '#FBBF24' : '#818CF8'}
                          />
                        </View>
                        <View className="flex-1">
                          <Text className="text-sm font-medium text-slate-200" numberOfLines={1}>
                            {email}
                          </Text>
                          {isCurrentUser && (
                            <Text className="text-[11px] text-indigo-400 font-medium">
                              (You)
                            </Text>
                          )}
                        </View>
                      </View>

                      <View className="flex-row items-center space-x-2">
                        {isThisOwner ? (
                          <Badge label="Owner" variant="warning" size="sm" />
                        ) : isOwner ? (
                          <Pressable
                            onPress={() => confirmRemove(email)}
                            disabled={isRemoving}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20"
                          >
                            {isRemoving ? (
                              <ActivityIndicator size="small" color="#FB7185" />
                            ) : (
                              <Ionicons name="trash-outline" size={16} color="#FB7185" />
                            )}
                          </Pressable>
                        ) : (
                          <Badge label="Member" variant="neutral" size="sm" />
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {/* Footer Actions */}
          <View className="mt-6 pt-4 border-t border-slate-800 flex-row justify-between items-center">
            {!isOwner ? (
              <Button
                title="Leave List"
                variant="danger"
                size="sm"
                icon="log-out-outline"
                onPress={confirmLeave}
              />
            ) : (
              <Text className="text-xs text-slate-500">
                You are the owner of this list.
              </Text>
            )}
            <Button
              title="Done"
              variant="outline"
              size="sm"
              onPress={onClose}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
