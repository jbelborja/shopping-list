import React from 'react';
import { View, Text } from 'react-native';

export interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary';
  size?: 'sm' | 'md';
  className?: string;
  customColor?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  size = 'md',
  className = '',
  customColor,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return { container: 'bg-emerald-500/15 border border-emerald-500/30', text: 'text-emerald-400' };
      case 'warning':
        return { container: 'bg-amber-500/15 border border-amber-500/30', text: 'text-amber-400' };
      case 'error':
        return { container: 'bg-rose-500/15 border border-rose-500/30', text: 'text-rose-400' };
      case 'info':
        return { container: 'bg-sky-500/15 border border-sky-500/30', text: 'text-sky-400' };
      case 'primary':
        return { container: 'bg-indigo-500/15 border border-indigo-500/30', text: 'text-indigo-400' };
      case 'default':
      default:
        return { container: 'bg-slate-700/50 border border-slate-600/50', text: 'text-slate-300' };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { container: 'px-2 py-0.5 rounded-md', text: 'text-[11px] font-medium' };
      case 'md':
      default:
        return { container: 'px-2.5 py-1 rounded-lg', text: 'text-xs font-semibold' };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  if (customColor) {
    return (
      <View
        className={`self-start items-center justify-center rounded-lg px-2.5 py-0.5 border ${sizeStyles.container} ${className}`}
        style={{
          backgroundColor: `${customColor}18`,
          borderColor: `${customColor}40`,
        }}
      >
        <Text
          className={`tracking-tight ${sizeStyles.text}`}
          style={{ color: customColor }}
        >
          {label}
        </Text>
      </View>
    );
  }

  return (
    <View
      className={`self-start items-center justify-center ${variantStyles.container} ${sizeStyles.container} ${className}`}
    >
      <Text className={`${variantStyles.text} ${sizeStyles.text} tracking-tight`}>
        {label}
      </Text>
    </View>
  );
};

export default Badge;
