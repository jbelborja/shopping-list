import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  NativeSyntheticEvent,
  TextInputFocusEventData,
} from 'react-native';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  className = '',
  onFocus,
  onBlur,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const getBorderColor = () => {
    if (error) return 'border-rose-500/80 bg-rose-500/10';
    if (isFocused) return 'border-indigo-500 bg-slate-900 shadow-sm shadow-indigo-500/20';
    return 'border-slate-700/80 bg-slate-900/60';
  };

  return (
    <View className={`w-full mb-3.5 ${className}`}>
      {label ? (
        <Text className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
          {label}
        </Text>
      ) : null}

      <View
        className={`flex-row items-center border rounded-xl px-3.5 py-2.5 transition-all ${getBorderColor()}`}
      >
        {leftIcon ? <View className="mr-2.5">{leftIcon}</View> : null}

        <TextInput
          className="flex-1 text-white text-sm p-0 placeholder:text-slate-500"
          placeholderTextColor="#64748B"
          underlineColorAndroid="transparent"
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...textInputProps}
        />

        {rightIcon ? <View className="ml-2.5">{rightIcon}</View> : null}
      </View>

      {error ? (
        <Text className="text-xs text-rose-400 mt-1.5 ml-1 font-medium">
          {error}
        </Text>
      ) : null}
    </View>
  );
};

export default Input;
