import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

/**
 * Componente Card con stile premium e bordi arrotondati.
 */
export const Card: React.FC<CardProps> = ({ children, style, ...props }) => {
  const { theme } = useTheme();

  return (
    <View 
      style={[
        styles.card, 
        { 
          backgroundColor: theme.colors.surface, 
          borderColor: theme.colors.border 
        }, 
        style
      ]} 
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
  },
});
