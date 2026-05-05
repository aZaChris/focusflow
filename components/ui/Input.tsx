import React from 'react';
import { TextInput, StyleSheet, View, Text, TextInputProps } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

/**
 * Componente Input standard per FocusFlow.
 */
export const Input: React.FC<InputProps> = ({ label, error, style, ...props }) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: theme.colors.textMuted, fontFamily: theme.typography.sans }]}>
          {label}
        </Text>
      )}
      <TextInput
        style={[
          styles.input,
          { 
            backgroundColor: theme.colors.surface, 
            color: theme.colors.text, 
            borderColor: error ? theme.colors.error : theme.colors.border,
            fontFamily: theme.typography.sans 
          },
          style
        ]}
        placeholderTextColor={theme.colors.textMuted}
        {...props}
      />
      {error && (
        <Text style={[styles.error, { color: theme.colors.error, fontFamily: theme.typography.sans }]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    padding: 18,
    borderRadius: 15,
    borderWidth: 1,
    fontSize: 16,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});
