import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useResponsive } from '../layout/useResponsive';
import { makeStyles, useTheme } from '../theme';

type Props = {
  children: ReactNode;
  /** Contenido fijo arriba (cabecera, barra de progreso). No hace scroll. */
  header?: ReactNode;
  /** Contenido fijo abajo (botón principal). No hace scroll. */
  footer?: ReactNode;
  scroll?: boolean;
  /** Centra verticalmente el contenido. Para pantallas tipo bienvenida. */
  center?: boolean;
  contentStyle?: ViewStyle;
};

/**
 * Contenedor de pantalla. Resuelve de una vez, para toda la app:
 *  - safe area en móvil,
 *  - columna centrada y limitada en tablet, iPad y web,
 *  - separación entre zona fija y zona con scroll.
 *
 * Una pantalla nunca gestiona esto por su cuenta.
 */
export function Screen({
  children,
  header,
  footer,
  scroll = true,
  center = false,
  contentStyle,
}: Props) {
  const styles = useStyles();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { columnWidth, isWide } = useResponsive();

  const column: ViewStyle = {
    width: '100%',
    maxWidth: columnWidth,
    alignSelf: 'center',
    flex: 1,
  };

  const body = (
    <View style={[styles.body, center && styles.centered, contentStyle]}>{children}</View>
  );

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, theme.spacing.md) },
        isWide && styles.rootWide,
      ]}
    >
      <View style={column}>
        {header}
        {scroll ? (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.scrollContent, center && styles.centeredContent]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {body}
          </ScrollView>
        ) : (
          body
        )}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: t.colors.backgroundElevated,
    },
    rootWide: {
      backgroundColor: t.colors.background,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: t.spacing.xl,
      paddingBottom: t.spacing.xl,
    },
    centeredContent: {
      justifyContent: 'center',
    },
    body: {
      gap: t.spacing.lg,
    },
    // Centrado vertical, pero los hijos siguen ocupando el ancho completo. Si
    // se centraran también en horizontal, cada tarjeta se encogería a su
    // contenido y las cajas dejarían de estar alineadas entre sí.
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'stretch',
      gap: t.spacing.xl,
    },
    footer: {
      paddingHorizontal: t.spacing.xl,
      paddingTop: t.spacing.md,
      gap: t.spacing.md,
    },
  }),
);
