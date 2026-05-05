import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, TouchableOpacityProps } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
}

/**
 * Componente Button universale per FocusFlow.
 * Supporta diverse varianti e il caricamento, adattandosi automaticamente al tema.
 */
export const Button: React.FC<ButtonProps> = ({ 
  title, 
  loading, 
  variant = 'primary', 
  style, 
  disabled, 
  ...props 
}) => {
  const { theme } = useTheme();

  const getButtonStyle = () => {
    switch (variant) {
      case 'outline':
        return [styles.button, { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.primary }];
      case 'ghost':
        return [styles.button, { backgroundColor: 'transparent' }];
      case 'danger':
        return [styles.button, { backgroundColor: theme.colors.error }];
      default:
        return [styles.button, { backgroundColor: theme.colors.primary }];
    }
  };

  const getTextColor = () => {
    if (variant === 'danger') return '#fff';
    switch (variant) {
      case 'outline':
      case 'ghost':
        return theme.colors.primary;
      default:
        return theme.colors.background;
    }
  };

  return (
    <TouchableOpacity 
      style={[...getButtonStyle() as any, disabled || loading ? styles.disabled : null, style]} 
      disabled={disabled || loading} 
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text style={[styles.text, { color: getTextColor(), fontFamily: theme.typography.sans }]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 16,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabled: {
    opacity: 0.5,
  },
});
