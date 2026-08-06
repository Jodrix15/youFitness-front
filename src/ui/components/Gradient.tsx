import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { useTheme } from '../theme';

export type NombreGradiente = 'marca' | 'accion' | 'xp' | 'fab';

type Props = {
  nombre: NombreGradiente;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Envoltorio del degradado.
 *
 * Existe para que ningún componente importe `expo-linear-gradient` ni escriba
 * una lista de colores a mano: se pide un degradado por nombre y sale del tema.
 * Cambiar la identidad visual sigue siendo editar `theme/tokens.ts` y nada más.
 */
export function Gradient({ nombre, children, style }: Props) {
  const theme = useTheme();
  const g = theme.gradients[nombre];

  return (
    <LinearGradient
      colors={g.colors as unknown as readonly [string, string, ...string[]]}
      start={g.start}
      end={g.end}
      style={style}
    >
      {children}
    </LinearGradient>
  );
}
