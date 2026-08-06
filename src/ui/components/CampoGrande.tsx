import {
  Platform,
  StyleSheet,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from 'react-native';

import { makeStyles, useTheme } from '../theme';
import { Card } from './Card';
import { Text } from './Text';

type Props = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  /** Sufijo a la derecha del número: kg, cm, h… */
  unidad?: string;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  inputMode?: 'decimal' | 'numeric' | 'text';
  maxLength?: number;
  /** Tarjeta con el color de acento. Para el campo principal de la pantalla. */
  destacado?: boolean;
  /** Borde de acento cuando el contenido ya es válido. */
  valido?: boolean;
  autoFocus?: boolean;
  ayuda?: string;
};

/**
 * Envoltura común de los campos de entrada grandes.
 *
 * Existe para que el campo de peso, el de altura y el de la hora de acostarse
 * sean EXACTAMENTE la misma caja. Antes cada uno traía su propio maquetado y se
 * veían distintos puestos uno al lado del otro.
 *
 * Solo pinta y recoge texto: el filtrado de pulsaciones y el formato viven en
 * quien la usa (`NumberField`, `CampoHora`), porque son reglas distintas.
 */
export function CampoGrande({
  label,
  value,
  onChangeText,
  unidad,
  placeholder = '—',
  keyboardType = 'default',
  inputMode = 'text',
  maxLength,
  destacado = false,
  valido = false,
  autoFocus = false,
  ayuda,
}: Props) {
  const styles = useStyles();
  const theme = useTheme();

  return (
    <Card
      variant={destacado ? 'accent' : 'default'}
      style={valido && !destacado ? { borderColor: theme.colors.accentBorder } : undefined}
    >
      <Text variant="overline" tone="faint">
        {label}
      </Text>

      <View style={styles.fila}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textFaint}
          keyboardType={keyboardType}
          inputMode={inputMode}
          maxLength={maxLength}
          autoFocus={autoFocus}
          selectionColor={theme.colors.accent}
          style={[
            styles.input,
            destacado && { color: theme.colors.accent },
            // En web el navegador dibuja su propio contorno al enfocar.
            Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null,
          ]}
        />
        {unidad ? (
          <Text variant="caption" tone="muted" weight="semibold">
            {unidad}
          </Text>
        ) : null}
      </View>

      {ayuda ? (
        <Text variant="small" tone="faint">
          {ayuda}
        </Text>
      ) : null}
    </Card>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    fila: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: t.spacing.sm,
    },
    input: {
      flex: 1,
      // Imprescindible en web: react-native-web pinta un <input> real, y un
      // <input> no encoge por debajo de su ancho intrínseco de unos 173 px.
      minWidth: 0,
      color: t.colors.text,
      fontSize: t.fontSize.displayLg,
      fontWeight: t.fontWeight.black,
      letterSpacing: t.letterSpacing.display,
      padding: 0,
      // Android añade relleno vertical propio que descuadra la línea base.
      paddingVertical: 0,
    },
  }),
);
