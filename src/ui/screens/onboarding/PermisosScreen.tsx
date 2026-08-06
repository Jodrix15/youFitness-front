import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { useOnboardingStore } from '../../../application/onboarding/onboardingStore';
import { Aviso, Button, Card, Screen, StepHeader, Text, Tick } from '../../components';
import { makeStyles } from '../../theme';

type Props = {
  onTerminar: () => void;
  onAtras: () => void;
  guardando: boolean;
  error: string | null;
};

/**
 * Pantalla 05 · Permisos.
 *
 * Se explica para qué sirve cada permiso ANTES de lanzar el diálogo del sistema:
 * si se pide a pelo y el usuario dice que no, recuperarlo obliga a ir a los
 * ajustes del móvil.
 *
 * Solo se leen pasos. Nada de pulso en reposo ni sueño automático: sin wearable
 * no hay fuente de la que leerlos, y el sueño se introduce a mano en el check-in
 * nocturno.
 *
 * PENDIENTE: los diálogos reales del sistema llegan con el módulo nativo de
 * salud, que necesita build de desarrollo. De momento se registra la intención
 * del usuario, que es lo que decide si el objetivo de pasos se crea o no.
 */
export function PermisosScreen({ onTerminar, onAtras, guardando, error }: Props) {
  const styles = useStyles();
  const store = useOnboardingStore();
  const [pedido, setPedido] = useState<{ pasos: boolean; avisos: boolean }>({
    pasos: false,
    avisos: false,
  });

  const enWeb = Platform.OS === 'web';

  return (
    <Screen
      header={<StepHeader paso={4} total={4} onBack={onAtras} />}
      footer={
        <>
          {error ? (
            <Text variant="small" tone="danger" center>
              {error}
            </Text>
          ) : null}
          <Button label="Entrar a YouFitness" onPress={onTerminar} loading={guardando} />
        </>
      }
    >
      <View style={styles.intro}>
        <Text variant="displaySm">Dos permisos y listo</Text>
        <Text variant="caption" tone="muted">
          Los dos son opcionales. Puedes cambiarlos luego en Ajustes.
        </Text>
      </View>

      <Card>
        <View style={styles.cabecera}>
          <View style={styles.icono}>
            <Text variant="label">🚶</Text>
          </View>
          <View style={styles.texto}>
            <Text variant="body" weight="bold">
              Pasos
            </Text>
            <Text variant="small" tone="muted">
              Leo los pasos que ya cuenta tu dispositivo. No necesitas reloj ni
              pulsera.
            </Text>
          </View>
          <Tick activo={store.permisoPasos} />
        </View>
        <Text variant="small" tone="faint">
          Sin esto: tendrás que apuntar los pasos a mano o quitar ese objetivo.
        </Text>
        <Button
          label={store.permisoPasos ? 'Acceso concedido' : 'Permitir acceso'}
          variant="secondary"
          size="sm"
          disabled={enWeb || store.permisoPasos}
          onPress={() => {
            store.setPermisoPasos(true);
            setPedido((p) => ({ ...p, pasos: true }));
          }}
        />
        {enWeb ? (
          <Text variant="small" tone="faint">
            En la versión web no hay contador de pasos. Este permiso solo aparece
            en el móvil.
          </Text>
        ) : null}
      </Card>

      <Card>
        <View style={styles.cabecera}>
          <View style={styles.icono}>
            <Text variant="label">🔔</Text>
          </View>
          <View style={styles.texto}>
            <Text variant="body" weight="bold">
              Notificaciones
            </Text>
            <Text variant="small" tone="muted">
              Recordatorios de pesarte y de cerrar el día.
            </Text>
          </View>
          <Tick activo={store.permisoNotificaciones} />
        </View>
        <Text variant="small" tone="faint">
          Sin esto: nada de rachas rotas por olvido, pero tendrás que acordarte tú.
        </Text>
        <Button
          label={store.permisoNotificaciones ? 'Avisos activados' : 'Permitir avisos'}
          variant="secondary"
          size="sm"
          disabled={store.permisoNotificaciones}
          onPress={() => {
            store.setPermisoNotificaciones(true);
            setPedido((p) => ({ ...p, avisos: true }));
          }}
        />
      </Card>

      {pedido.pasos ? (
        <Aviso icono="ℹ️">
          En iOS no se puede distinguir «permiso denegado» de «sin datos»: los dos
          casos devuelven una lista vacía. Si algún día no ves pasos, la app te
          dirá «sin datos» y te llevará a Ajustes.
        </Aviso>
      ) : null}

      <Aviso icono="💾" tono="flat">
        Tus datos viven solo en este dispositivo. Exporta una copia de vez en
        cuando desde Ajustes: si borras la app o los datos del navegador, no hay
        forma de recuperarlos.
      </Aviso>
    </Screen>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    intro: { gap: t.spacing.xs },
    cabecera: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: t.spacing.md,
    },
    icono: {
      width: 36,
      height: 36,
      borderRadius: t.radius.md,
      backgroundColor: t.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: t.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    texto: { flex: 1, gap: t.spacing.xs },
  }),
);
