import { StyleSheet, View } from 'react-native';

import { useOnboardingStore } from '../../../application/onboarding/onboardingStore';
import { MODULOS } from '../../../domain/models/modulo';
import { Button, Card, ListItem, Screen, StepHeader, Text, Tick } from '../../components';
import { makeStyles } from '../../theme';

type Props = {
  onContinuar: () => void;
  onAtras: () => void;
};

/**
 * Pantalla 03 · Bloques.
 *
 * No hay "Saltar": sin bloques la app no sabe qué mostrar, así que vienen tres
 * premarcados.
 *
 * REGLA (§10): los bloques NO ocultan pestañas. Serían 32 combinaciones de
 * navegación que probar, y quien activa un bloque más tarde no encontraría
 * dónde ha aparecido.
 */
export function BloquesScreen({ onContinuar, onAtras }: Props) {
  const styles = useStyles();
  const seleccionados = useOnboardingStore((s) => s.modulos);
  const alternar = useOnboardingStore((s) => s.alternarModulo);

  const alMenosUno = seleccionados.length > 0;

  return (
    <Screen
      header={<StepHeader paso={2} total={4} onBack={onAtras} />}
      footer={<Button label="Continuar" onPress={onContinuar} disabled={!alMenosUno} />}
    >
      <View style={styles.intro}>
        <Text variant="displaySm">¿Qué quieres seguir?</Text>
        <Text variant="caption" tone="muted">
          Cada bloque añade tarjetas a tu Inicio y su propia fuente de XP. Podrás
          activarlos o quitarlos cuando quieras.
        </Text>
      </View>

      {MODULOS.map((m) => {
        const activo = seleccionados.includes(m.clave);
        return (
          <Card key={m.clave} variant={activo ? 'accent' : 'default'}>
            <ListItem
              icono={m.icono}
              titulo={m.nombre}
              subtitulo={m.descripcion}
              seleccionado={activo}
              onPress={() => alternar(m.clave)}
              derecha={<Tick activo={activo} />}
            />
          </Card>
        );
      })}

      <Card variant="flat">
        <Text variant="small" tone="muted">
          Las pestañas de la app estarán siempre disponibles. Los bloques solo
          deciden qué ves primero.
        </Text>
      </Card>

      {!alMenosUno ? (
        <Text variant="small" tone="danger" center>
          Elige al menos un bloque para continuar.
        </Text>
      ) : null}
    </Screen>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    intro: { gap: t.spacing.xs },
  }),
);
