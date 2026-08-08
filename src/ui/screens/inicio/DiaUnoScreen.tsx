import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import type { EstadoNivel } from '../../../domain/rules/xp';
import { XP } from '../../../domain/rules/xp';
import { UMBRAL_CORRELACIONES } from '../../../domain/rules/sueno';
import { UMBRAL_TENDENCIA } from '../../../domain/rules/tendenciaPeso';
import { Button, CabeceraInicio, Card, ListItem, Screen, Text, Tick, XpBar } from '../../components';
import { entero } from '../../format';
import { makeStyles } from '../../theme';

type Props = {
  nombre: string;
  nivel: EstadoNivel;
  onPeso: () => void;
  onCheckin: () => void;
  onPerfil: () => void;
  /** Bloque extra al final. Hoy solo lo usan los atajos de desarrollo. */
  pie?: ReactNode;
};

/**
 * Pantalla 07 · Inicio · día 1.
 *
 * El estado vacío es la pantalla que de verdad decide si sigues usando la app.
 * Por eso ofrece UN SOLO camino —pesarse— en lugar de seis opciones que paralizan.
 *
 * Y dice explícitamente qué se desbloqueará y con cuántos registros: la promesa
 * concreta de lo que vas a conseguir es lo que sostiene las dos primeras
 * semanas, que son las que se abandonan.
 */
export function DiaUnoScreen({ nombre, nivel, onPeso, onCheckin, onPerfil, pie }: Props) {
  const styles = useStyles();

  return (
    <Screen>
      <CabeceraInicio
        nombre={nombre}
        subtitulo="Tu primer día"
        nivel={nivel.nivel}
        diasDeRacha={0}
        onPerfil={onPerfil}
      />

      <XpBar estado={nivel} />

      <Card variant="accent" style={styles.destacado}>
        <Text style={styles.iconoGrande}>⚖️</Text>
        <Text variant="label" center>
          Empieza por pesarte
        </Text>
        <Text variant="small" tone="muted" center>
          Es el registro más rápido y el que hace que todo lo demás tenga
          sentido. Diez segundos.
        </Text>
        <Button
          label={`Registrar mi peso · +${entero(XP.registrarPeso)} XP`}
          size="sm"
          onPress={onPeso}
          style={styles.botonAncho}
        />
      </Card>

      <Text variant="overline" tone="faint">
        Y cuando puedas, hoy
      </Text>
      <Card>
        <ListItem
          titulo="Apunta una comida"
          subtitulo="La primera te costará; la quinta, nada"
          derecha={<Text variant="small" tone="faint">{`+${entero(XP.registrarComida)} XP`}</Text>}
        />
        <ListItem
          titulo="Cierra el día"
          subtitulo="Ánimo, energía y cuánto has dormido"
          onPress={onCheckin}
          derecha={
            <Text variant="small" tone="accent" weight="bold">
              {`+${entero(XP.cerrarDia)} XP`}
            </Text>
          }
        />
      </Card>

      <Card variant="dashed">
        <Text variant="overline" tone="faint">
          Se irá desbloqueando
        </Text>
        <View style={styles.bloqueados}>
          <ListItem
            icono="📈"
            titulo="Tendencia de peso"
            subtitulo={`a partir de ${entero(UMBRAL_TENDENCIA)} pesajes`}
            derecha={<Tick activo={false} />}
          />
          <ListItem
            icono="🔗"
            titulo="Correlaciones"
            subtitulo={`a partir de ${entero(UMBRAL_CORRELACIONES)} check-ins`}
            derecha={<Tick activo={false} />}
          />
          <ListItem
            icono="💡"
            titulo="Patrones de deslices"
            subtitulo="a partir de 5 registros"
            derecha={<Tick activo={false} />}
          />
        </View>
      </Card>

      <Text variant="small" tone="faint" center style={styles.promesa}>
        {'No te voy a inventar gráficas con dos datos.\nLo que ves siempre será real.'}
      </Text>

      {pie}
    </Screen>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    destacado: { alignItems: 'center', paddingVertical: t.spacing.xxl, gap: t.spacing.md },
    iconoGrande: { fontSize: 34, lineHeight: 42 },
    botonAncho: { alignSelf: 'stretch', marginTop: t.spacing.xs },
    bloqueados: { opacity: 0.55 },
    promesa: { lineHeight: t.fontSize.tiny * t.lineHeight.relaxed },
  }),
);
