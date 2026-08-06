import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import type { FechaISO } from '../../domain/models/comunes';
import { makeStyles } from '../theme';
import { Button } from './Button';
import { CalendarioMes } from './CalendarioMes';
import { Text } from './Text';

type Props = {
  visible: boolean;
  seleccionada: FechaISO;
  hoy: FechaISO;
  conDatos: ReadonlySet<FechaISO>;
  onSeleccionar: (fecha: FechaISO) => void;
  onCerrar: () => void;
};

/**
 * Calendario en una hoja, para elegir el día que se está viendo.
 *
 * Sustituye a la barra de «‹ Ayer · Hoy · ›»: para volver a un martes de hace
 * tres semanas, esa barra obligaba a veinte toques. Con el calendario es uno.
 *
 * Tocar fuera cierra sin cambiar nada.
 */
export function SelectorFecha({
  visible,
  seleccionada,
  hoy,
  conDatos,
  onSeleccionar,
  onCerrar,
}: Props) {
  const styles = useStyles();
  const [mesVisible, setMesVisible] = useState<FechaISO>(seleccionada);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCerrar}
      accessibilityViewIsModal
    >
      <Pressable style={styles.fondo} onPress={onCerrar} accessibilityLabel="Cerrar el calendario">
        {/* El Pressable interior come el toque para que no cierre al usar el calendario. */}
        <Pressable style={styles.hoja} onPress={() => undefined}>
          <View style={styles.cabecera}>
            <Text variant="label">Elegir día</Text>
            <Pressable accessibilityRole="button" onPress={onCerrar} hitSlop={12}>
              <Text variant="caption" tone="muted">
                Cerrar
              </Text>
            </Pressable>
          </View>

          <CalendarioMes
            seleccionada={seleccionada}
            hoy={hoy}
            conDatos={conDatos}
            mesVisible={mesVisible}
            onCambiarMes={setMesVisible}
            onSeleccionar={(f) => {
              onSeleccionar(f);
              onCerrar();
            }}
          />

          <View style={styles.leyenda}>
            <View style={styles.punto} />
            <Text variant="small" tone="faint">
              días con algo registrado
            </Text>
          </View>

          {seleccionada !== hoy ? (
            <Button
              label="Volver a hoy"
              variant="secondary"
              size="sm"
              onPress={() => {
                onSeleccionar(hoy);
                onCerrar();
              }}
            />
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    fondo: {
      flex: 1,
      backgroundColor: t.colors.overlay,
      justifyContent: 'center',
      padding: t.spacing.xl,
    },
    hoja: {
      alignSelf: 'center',
      width: '100%',
      maxWidth: 380,
      backgroundColor: t.colors.surface,
      borderRadius: t.radius.xl,
      borderWidth: 1,
      borderColor: t.colors.border,
      padding: t.spacing.xl,
      gap: t.spacing.lg,
    },
    cabecera: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    leyenda: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
    punto: {
      width: 4,
      height: 4,
      borderRadius: 4,
      backgroundColor: t.colors.accent,
    },
  }),
);
