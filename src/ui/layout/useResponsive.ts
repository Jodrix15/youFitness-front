import { useWindowDimensions } from 'react-native';

import { tokens } from '../theme';

export type DeviceClass = 'phone' | 'tablet' | 'desktop';

export type Responsive = {
  width: number;
  height: number;
  device: DeviceClass;
  isPhone: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  /** true en tablet y escritorio: hay sitio para dos columnas o barra lateral. */
  isWide: boolean;
  /** Ancho de la columna de contenido para esta pantalla. */
  columnWidth: number;
};

/**
 * Única fuente de verdad sobre el tamaño de pantalla.
 *
 * Las pantallas NO leen `Dimensions` ni `Platform.OS` por su cuenta: preguntan
 * aquí. Así el comportamiento responsive se cambia en un sitio y la lógica de
 * negocio nunca depende del dispositivo.
 */
export function useResponsive(): Responsive {
  const { width, height } = useWindowDimensions();

  const device: DeviceClass =
    width >= tokens.breakpoints.desktop
      ? 'desktop'
      : width >= tokens.breakpoints.tablet
        ? 'tablet'
        : 'phone';

  const columnWidth =
    device === 'phone'
      ? width
      : device === 'tablet'
        ? tokens.layout.tabletColumnWidth
        : tokens.layout.phoneColumnWidth;

  return {
    width,
    height,
    device,
    isPhone: device === 'phone',
    isTablet: device === 'tablet',
    isDesktop: device === 'desktop',
    isWide: device !== 'phone',
    columnWidth,
  };
}
