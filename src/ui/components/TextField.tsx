import { StyleSheet, TextInput, View } from 'react-native';

import { makeStyles, useTheme } from '../theme';
import { Text } from './Text';

type Props = {
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  maxLength?: number;
  ayuda?: string;
  /** Oculta lo tecleado. Para contraseñas. */
  secreto?: boolean;
  /** Ajusta teclado y autocorrección. Un correo con mayúscula inicial no entra. */
  tipo?: 'texto' | 'correo';
};

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  autoFocus = false,
  maxLength,
  ayuda,
  secreto = false,
  tipo = 'texto',
}: Props) {
  const styles = useStyles();
  const theme = useTheme();
  const relleno = value.length > 0;
  const sinAyudasDelTeclado = secreto || tipo === 'correo';

  return (
    <View style={styles.wrap}>
      {label ? (
        <Text variant="overline" tone="faint">
          {label}
        </Text>
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textFaint}
        autoFocus={autoFocus}
        maxLength={maxLength}
        secureTextEntry={secreto}
        keyboardType={tipo === 'correo' ? 'email-address' : 'default'}
        autoCapitalize={sinAyudasDelTeclado ? 'none' : 'sentences'}
        autoCorrect={!sinAyudasDelTeclado}
        style={[styles.input, relleno && { borderColor: theme.colors.accent }]}
        selectionColor={theme.colors.accent}
      />
      {ayuda ? (
        <Text variant="small" tone="faint">
          {ayuda}
        </Text>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    wrap: { gap: t.spacing.sm, width: '100%' },
    input: {
      // Mismo motivo que en NumberField: el <input> de web no encoge solo.
      minWidth: 0,
      height: t.control.inputHeight,
      borderRadius: t.radius.lg,
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: t.colors.surfaceAlt,
      paddingHorizontal: t.spacing.lg,
      color: t.colors.text,
      fontSize: 16,
      fontWeight: '700',
    },
  }),
);
