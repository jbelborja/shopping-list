import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  View,
} from 'react-native';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  className = '',
}) => {
  const isDisabled = disabled || loading;

  const getVariantContainerStyles = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700';
      case 'outline':
        return 'bg-transparent border border-indigo-500 hover:bg-indigo-500/10 active:bg-indigo-500/20';
      case 'ghost':
        return 'bg-transparent hover:bg-white/5 active:bg-white/10';
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-500 active:bg-rose-700';
      case 'primary':
      default:
        return 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 shadow-md shadow-indigo-600/30';
    }
  };

  const getVariantTextStyles = () => {
    switch (variant) {
      case 'outline':
      case 'ghost':
        return 'text-indigo-400 font-semibold';
      case 'secondary':
      case 'danger':
      case 'primary':
      default:
        return 'text-white font-semibold';
    }
  };

  const getSizeContainerStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 rounded-lg';
      case 'lg':
        return 'px-6 py-3.5 rounded-2xl';
      case 'md':
      default:
        return 'px-4 py-2.5 rounded-xl';
    }
  };

  const getSizeTextStyles = () => {
    switch (size) {
      case 'sm':
        return 'text-xs';
      case 'lg':
        return 'text-base';
      case 'md':
      default:
        return 'text-sm';
    }
  };

  const getSpinnerColor = () => {
    if (variant === 'outline' || variant === 'ghost') {
      return '#818CF8';
    }
    return '#FFFFFF';
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`flex-row items-center justify-center transition-all ${getVariantContainerStyles()} ${getSizeContainerStyles()} ${
        isDisabled ? 'opacity-50' : 'opacity-100 active:scale-[0.98]'
      } ${className}`}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getSpinnerColor()} />
      ) : (
        <View className="flex-row items-center justify-center">
          {leftIcon ? <View className="mr-2">{leftIcon}</View> : null}
          <Text className={`text-center tracking-tight ${getVariantTextStyles()} ${getSizeTextStyles()}`}>
            {title}
          </Text>
          {rightIcon ? <View className="ml-2">{rightIcon}</View> : null}
        </View>
      )}
    </Pressable>
  );
};

export default Button;
