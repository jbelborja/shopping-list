import React from 'react';
import { View, Pressable } from 'react-native';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  onPress?: () => void;
  elevated?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onPress,
  elevated = true,
}) => {
  const baseStyles = 'bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4';
  const elevationStyles = elevated
    ? 'shadow-lg shadow-black/20'
    : '';

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className={`${baseStyles} ${elevationStyles} hover:border-indigo-500/50 hover:bg-slate-800 active:scale-[0.99] transition-all ${className}`}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View className={`${baseStyles} ${elevationStyles} ${className}`}>
      {children}
    </View>
  );
};

export default Card;
