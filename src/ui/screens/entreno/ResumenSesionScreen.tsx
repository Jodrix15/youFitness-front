import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { Ejercicio, Sesion } from '../../../domain/models/entreno';
import type { DesgloseXpSesion } from '../../../domain/rules/sesionXp';
import { ETIQUETA_RECORD, totalizarSesion } from '../../../domain/rules/volumen';
import {
  Button,
  Card,
  EscalaNumerica,
  ListItem,
  Screen,
  Text,
  TextField,
} from '../../components';
import { entero, kg } from '../../format';
import { makeStyles } from '../../theme';

type Props = {
  sesion: Sesion;
  desglose: DesgloseXpSesion;
  xpGanado: number;
  multiplicador: number;
  ejercicios: ReadonlyMap<string, Ejercicio>;
  onGuardarCierre: (esfuerzo: number, nota: string | null) => void;
  onSalir: () => void;
};

/**
 * Pantalla 18 · Resumen de sesión.
 *
 * Enseña de dónde sale cada punto en lugar de un total mágico. Es lo mismo que
 * hace el log de XP por debajo, y lo que permite que la gamificación no parezca
 * arbitraria: si sabes que las series suman 2,5 cada una, anotarlas tiene
 * sentido.
 */
export function ResumenSesionScreen({
  sesion,
  desglose,
  xpGanado,
  multiplicador,
  ejercicios,
  onGuardarCierre,
  onSalir,
}: Props) {
  const styles = useStyles();
  const [esfuerzo, setEsfuerzo] = useState(sesion.esfuerzoPercibido ?? 7);
  const [nota, setNota] = useState(sesion.nota ?? '');

  const totales = totalizarSesion(sesion.series, ejercicios);

  const duracion =
    sesion.horaFin && sesion.horaInicio ? minutosEntre(sesion.horaInicio, sesion.horaFin) : null;

  return (
    <Screen
      footer={
        <Button
          label="Guardar y salir"
          onPress={() => {
            onGuardarCierre(esfuerzo, nota.trim() || null);
            onSalir();
          }}
        />
      }
    >
      <View style={styles.celebracion}>
        <Text style={styles.icono}>💪</Text>
        <Text variant="displaySm" center>
          Sesión terminada
        </Text>
        <Text variant="caption" tone="muted" center>
          {sesion.nombre}
        </Text>
      </View>

      <Card variant="xp">
        <Text variant="overline" tone="faint">
          De dónde salen tus XP
        </Text>
        <ListItem
          titulo="Completar el entreno"
          derecha={<Text variant="caption" weight="bold">{`+${entero(desglose.base)}`}</Text>}
        />
        <ListItem
          titulo={`${entero(sesion.series.length)} series registradas`}
          subtitulo="2,5 XP por serie"
          derecha={<Text variant="caption" weight="bold">{`+${entero(desglose.porSeries)}`}</Text>}
        />
        {desglose.porRecords > 0 ? (
          <ListItem
            titulo={`${entero(desglose.records.length)} récord${desglose.records.length === 1 ? '' : 's'} personal${desglose.records.length === 1 ? '' : 'es'}`}
            derecha={
              <Text variant="caption" weight="bold" tone="warning">
                {`+${entero(desglose.porRecords)}`}
              </Text>
            }
          />
        ) : null}
        {multiplicador > 1 ? (
          <ListItem
            titulo="Multiplicador de racha"
            subtitulo="Por tus días seguidos registrando"
            derecha={
              <Text variant="caption" weight="bold" tone="accent">
                {`×${multiplicador.toFixed(1).replace('.', ',')}`}
              </Text>
            }
          />
        ) : null}

        <View style={styles.total}>
          <Text variant="label">Total</Text>
          <Text variant="displaySm" tone="xp">
            {`+${entero(xpGanado)} XP`}
          </Text>
        </View>
      </Card>

      {desglose.records.length > 0 ? (
        <Card variant="warning">
          <Text variant="overline" tone="warning">
            {`🏆 ${entero(desglose.records.length)} récord${desglose.records.length === 1 ? '' : 's'} hoy`}
          </Text>
          {desglose.records.map((r) => (
            <ListItem
              key={r.ejercicioId}
              titulo={ejercicios.get(r.ejercicioId)?.nombre ?? 'Ejercicio'}
              subtitulo={`Antes: ${entero(r.anterior)} ${ETIQUETA_RECORD[r.clase]}`}
              derecha={
                <Text variant="caption" weight="bold" tone="warning">
                  {`${entero(r.valor)} ${ETIQUETA_RECORD[r.clase]}  ·  +${entero(r.mejora)}`}
                </Text>
              }
            />
          ))}
        </Card>
      ) : null}

      <View style={styles.tresColumnas}>
        <Card variant="flat" style={styles.columna}>
          <Text variant="overline" tone="faint">
            Volumen
          </Text>
          <Text variant="body" weight="black">
            {`${kg(totales.volumenKg, 0)} kg`}
          </Text>
        </Card>
        <Card variant="flat" style={styles.columna}>
          <Text variant="overline" tone="faint">
            Series
          </Text>
          <Text variant="body" weight="black">
            {entero(totales.seriesTotales)}
          </Text>
        </Card>
        <Card variant="flat" style={styles.columna}>
          <Text variant="overline" tone="faint">
            {duracion != null ? 'Duración' : 'Reps'}
          </Text>
          <Text variant="body" weight="black">
            {duracion != null ? `${entero(duracion)} min` : entero(totales.repsTotales)}
          </Text>
        </Card>
      </View>

      {totales.segundosIsometricos > 0 ? (
        <Card variant="flat">
          <Text variant="small" tone="muted">
            {`Además, ${entero(totales.segundosIsometricos)} segundos de isométrico. Van aparte del volumen en kilos porque son otra unidad: aguantar no es lo mismo que mover.`}
          </Text>
        </Card>
      ) : null}

      <Card>
        <Text variant="overline" tone="faint">
          ¿Cómo de duro se te ha hecho?
        </Text>
        <EscalaNumerica
          valor={esfuerzo}
          onChange={setEsfuerzo}
          etiquetaMin="Suave"
          etiquetaMax="Al límite"
          etiquetaAccesible="Esfuerzo percibido"
        />
      </Card>

      <TextField
        label="Nota (opcional)"
        value={nota}
        onChangeText={setNota}
        placeholder="Buen día, la banca ha subido sola"
        maxLength={140}
      />
    </Screen>
  );
}

function minutosEntre(inicio: string, fin: string): number {
  const [hi, mi] = inicio.split(':').map(Number);
  const [hf, mf] = fin.split(':').map(Number);
  const desde = (hi ?? 0) * 60 + (mi ?? 0);
  let hasta = (hf ?? 0) * 60 + (mf ?? 0);
  // Sesión que cruza la medianoche.
  if (hasta < desde) hasta += 24 * 60;
  return hasta - desde;
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    celebracion: { alignItems: 'center', gap: t.spacing.sm, paddingVertical: t.spacing.lg },
    icono: { fontSize: 42, lineHeight: 52 },
    total: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderTopWidth: 1,
      borderTopColor: t.colors.border,
      paddingTop: t.spacing.md,
      marginTop: t.spacing.xs,
    },
    tresColumnas: { flexDirection: 'row', gap: t.spacing.md },
    columna: { flex: 1, alignItems: 'center' },
  }),
);
