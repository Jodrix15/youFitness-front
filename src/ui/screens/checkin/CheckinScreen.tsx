import { useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ACTIVIDADES, CARAS_ANIMO, type ClaveActividad } from '../../../domain/models/checkin';
import { compararConHabitual, esTrasnoche, UMBRAL_CORRELACIONES } from '../../../domain/rules/sueno';
import { XP } from '../../../domain/rules/xp';
import type { EstadoCheckin } from '../../../application/checkin/useCheckin';
import {
  Aviso,
  AvisoUmbral,
  Button,
  CampoHora,
  Card,
  Chip,
  ChipRow,
  EscalaEmoji,
  EscalaNumerica,
  Estrellas,
  NumberField,
  Screen,
  Text,
} from '../../components';
import { aNumero, entero } from '../../format';
import { makeStyles, useTheme } from '../../theme';

type Props = {
  estado: EstadoCheckin;
  modoEstricto: boolean;
  onCerrado: () => void;
  onAtras: () => void;
};

/**
 * Pantalla 10 · Check-in nocturno.
 *
 * Treinta segundos antes de dormir. Todo tiene un valor por defecto razonable
 * para que se pueda cerrar el día sin tocar nada: si exige seis decisiones, se
 * deja de hacer a la semana.
 *
 * El sueño se apunta a mano, no se lee de ningún sensor (§10).
 */
export function CheckinScreen({ estado, modoEstricto, onCerrado, onAtras }: Props) {
  const styles = useStyles();
  const theme = useTheme();
  const previo = estado.checkinDeHoy;

  const [animo, setAnimo] = useState<number | null>(previo?.animo ?? null);
  const [energia, setEnergia] = useState(previo?.energia ?? 5);
  const [estres, setEstres] = useState(previo?.estres ?? 5);
  const [horaAcostarse, setHoraAcostarse] = useState(previo?.horaAcostarse ?? '');
  const [horasSueno, setHorasSueno] = useState(
    previo?.suenoHoras != null ? String(previo.suenoHoras).replace('.', ',') : '',
  );
  const [calidad, setCalidad] = useState<number | null>(previo?.suenoCalidad ?? null);
  const [actividades, setActividades] = useState<ClaveActividad[]>(previo?.actividades ?? []);
  const [nota, setNota] = useState(previo?.nota ?? '');
  const [guardando, setGuardando] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);

  const comparacion =
    horaAcostarse && estado.habitualMinutos != null
      ? compararConHabitual(horaAcostarse, estado.habitualMinutos)
      : null;

  const avisaTrasnoche = modoEstricto && horaAcostarse !== '' && esTrasnoche(horaAcostarse);

  function alternarActividad(clave: ClaveActividad) {
    setActividades((prev) =>
      prev.includes(clave) ? prev.filter((c) => c !== clave) : [...prev, clave],
    );
  }

  async function guardar() {
    setGuardando(true);
    try {
      const r = await estado.guardar({
        animo: animo ?? 3,
        energia,
        estres,
        suenoHoras: aNumero(horasSueno),
        suenoCalidad: calidad,
        horaAcostarse: horaAcostarse || null,
        nota: nota.trim() || null,
        actividades,
      });

      if (!r) return;
      setResultado(
        r.xpGanado === 0
          ? 'Check-in actualizado. El XP de hoy ya estaba concedido.'
          : r.xpPenalizado < 0
            ? `Día cerrado. +${entero(r.xpGanado)} XP, y ${entero(r.xpPenalizado)} por trasnochar.`
            : `Día cerrado. +${entero(r.xpGanado)} XP`,
      );
      onCerrado();
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Screen
      header={
        <View style={styles.barra}>
          <Pressable accessibilityRole="button" accessibilityLabel="Atrás" onPress={onAtras} hitSlop={12}>
            <Text variant="title" tone="accent">
              ←
            </Text>
          </Pressable>
          <Text variant="title" style={styles.tituloBarra}>
            Cerrar el día
          </Text>
          <Text variant="caption" tone="muted">
            30 s
          </Text>
        </View>
      }
      footer={
        <>
          {resultado ? (
            <Text variant="small" tone="accent" center>
              {resultado}
            </Text>
          ) : null}
          <Button
            label={previo ? 'Actualizar el check-in' : `Cerrar el día · +${entero(XP.cerrarDia)} XP`}
            onPress={() => void guardar()}
            loading={guardando}
          />
        </>
      }
    >
      <Card>
        <Text variant="overline" tone="faint">
          Ánimo
        </Text>
        <EscalaEmoji
          opciones={CARAS_ANIMO}
          valor={animo}
          onChange={setAnimo}
          etiquetaAccesible="Ánimo"
        />
      </Card>

      <Card>
        <Text variant="overline" tone="faint">
          Energía
        </Text>
        <EscalaNumerica
          valor={energia}
          onChange={setEnergia}
          etiquetaMin="Baja"
          etiquetaMax="Alta"
          etiquetaAccesible="Energía"
        />
      </Card>

      <Card>
        <Text variant="overline" tone="faint">
          Estrés
        </Text>
        <EscalaNumerica
          valor={estres}
          onChange={setEstres}
          etiquetaMin="Calma"
          etiquetaMax="Al límite"
          tono="warning"
          etiquetaAccesible="Estrés"
        />
      </Card>

      <Card>
        <Text variant="overline" tone="faint">
          Sueño de anoche
        </Text>
        <View style={styles.dos}>
          <View style={styles.mitad}>
            <CampoHora label="Me acosté" value={horaAcostarse} onChangeText={setHoraAcostarse} />
          </View>
          <View style={styles.mitad}>
            <NumberField
              label="Dormí"
              value={horasSueno}
              onChangeText={setHorasSueno}
              unidad="h"
              maxLength={4}
            />
          </View>
        </View>

        <View style={styles.filaCalidad}>
          <Text variant="caption" tone="muted">
            Calidad
          </Text>
          <Estrellas valor={calidad} onChange={setCalidad} etiquetaAccesible="Calidad del sueño" />
        </View>

        {comparacion ? (
          <Card variant="flat">
            <Text variant="small" tone="muted">
              {comparacion.texto}
            </Text>
          </Card>
        ) : (
          <Text variant="small" tone="faint">
            Con tres noches apuntadas empezaré a decirte cuál es tu hora habitual.
          </Text>
        )}

        {avisaTrasnoche ? (
          <Aviso icono="🌙" tono="danger">
            Con el modo estricto activado, acostarse después de las 2:00 resta 15
            XP. Apuntarlo sigue sumando los 30 de cerrar el día: el castigo es por
            la hora, nunca por registrarla.
          </Aviso>
        ) : null}
      </Card>

      <Card>
        <Text variant="overline" tone="faint">
          Hoy he hecho…
        </Text>
        <ChipRow>
          {ACTIVIDADES.map((a) => (
            <Chip
              key={a.clave}
              label={`${a.icono} ${a.etiqueta}`}
              selected={actividades.includes(a.clave)}
              onPress={() => alternarActividad(a.clave)}
            />
          ))}
        </ChipRow>
      </Card>

      <Card>
        <Text variant="overline" tone="faint">
          Una línea sobre el día
        </Text>
        <TextInput
          value={nota}
          onChangeText={setNota}
          placeholder="Opcional. Dentro de un año lo agradecerás."
          placeholderTextColor={theme.colors.textFaint}
          multiline
          numberOfLines={3}
          selectionColor={theme.colors.accent}
          style={[styles.nota, Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null]}
        />
      </Card>

      {estado.faltanParaCorrelaciones > 0 ? (
        <AvisoUmbral
          titulo="Correlaciones"
          faltan={estado.faltanParaCorrelaciones}
          unidad={['check-in', 'check-ins']}
          para="poder cruzar sueño, ánimo y adherencia"
          motivo={`Con menos de ${entero(UMBRAL_CORRELACIONES)} registros, cualquier patrón que te enseñara sería casualidad.`}
        />
      ) : null}
    </Screen>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    barra: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.lg,
      paddingHorizontal: t.spacing.xl,
      paddingTop: t.spacing.sm,
      paddingBottom: t.spacing.md,
    },
    tituloBarra: { flex: 1 },
    dos: { flexDirection: 'row', gap: t.spacing.md, alignItems: 'flex-start' },
    mitad: { flex: 1 },
    filaCalidad: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    nota: {
      minHeight: 74,
      borderRadius: t.radius.md,
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: t.colors.surfaceAlt,
      padding: t.spacing.lg,
      color: t.colors.text,
      fontSize: t.fontSize.caption,
      textAlignVertical: 'top',
    },
  }),
);
