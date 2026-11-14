import React from 'react';
import { View, Text } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'cart-outline',
  title,
  subtitle,
  action,
  className = '',
}) => {
  return (
    <View
      className={`items-center justify-center p-8 bg-slate-800/40 rounded-3xl border border-slate-700/50 my-4 ${className}`}
    >
      <View className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 items-center justify-center mb-4 shadow-inner">
        <Ionicons
          name={icon as keyof typeof Ionicons.glyphMap}
          size={30}
          color="#818CF8"
        />
      </View>

      <Text className="text-lg font-bold text-white text-center mb-1">
        {title}
      </Text>

      {subtitle ? (
        <Text className="text-sm text-slate-400 text-center max-w-sm mb-6 leading-5">
          {subtitle}
        </Text>
      ) : null}

      {action ? (
        <Button
          title={action.label}
          onPress={action.onPress}
          size="md"
          variant="primary"
          leftIcon={<Ionicons name="add" size={18} color="#FFFFFF" />}
        />
      ) : null}
    </View>
  );
};

export default EmptyState;
