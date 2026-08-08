import { StyleSheet, View } from 'react-native';

import { TIPOS_EJERCICIO, type Rutina } from '../../../domain/models/entreno';
import type { EstadoEntreno } from '../../../application/entreno/useEntreno';
import { ETIQUETA_RECORD } from '../../../domain/rules/volumen';
import { XP } from '../../../domain/rules/xp';
import { Button, Card, ListItem, Screen, Text } from '../../components';
import { entero, kg } from '../../format';
import { makeStyles } from '../../theme';

type Props = {
  estado: EstadoEntreno;
  onEmpezar: (rutina: Rutina | null) => void;
  onContinuar: () => void;
  onNuevaRutina: () => void;
  onBiblioteca: () => void;
  onProgresion: () => void;
  onEscaleras: () => void;
};

/** Pantalla 15 · Entrenamientos. La portada del bloque. */
export function EntrenoScreen({
  estado,
  onEmpezar,
  onContinuar,
  onNuevaRutina,
  onBiblioteca,
  onProgresion,
  onEscaleras,
}: Props) {
  const styles = useStyles();
  const { rutinas, sesiones, enCurso, sesionesEstaSemana, totalesUltimaSemana, porId } = estado;

  // Los últimos récords, de las sesiones más recientes hacia atrás.
  const recordsRecientes = sesiones
    .slice()
    .reverse()
    .flatMap((s) => s.series.filter((x) => x.esPr).map((x) => ({ serie: x, sesion: s })))
    .slice(0, 3);

  return (
    <Screen>
      <View style={styles.cabecera}>
        <Text variant="displaySm">Entreno</Text>
        <Button label="Ejercicios" variant="secondary" size="sm" onPress={onBiblioteca} />
      </View>

      {enCurso ? (
        <Card variant="accent">
          <Text variant="overline" tone="faint">
            Sesión en curso
          </Text>
          <Text variant="label">{enCurso.nombre}</Text>
          <Text variant="small" tone="muted">
            {`${entero(enCurso.series.length)} series anotadas · empezada a las ${enCurso.horaInicio}`}
          </Text>
          <Button label="Continuar sesión" onPress={onContinuar} />
        </Card>
      ) : null}

      <Card>
        <View style={styles.filaTitulo}>
          <Text variant="overline" tone="faint">
            Esta semana
          </Text>
          <Text variant="small" weight="bold" tone={sesionesEstaSemana > 0 ? 'accent' : 'faint'}>
            {`${entero(sesionesEstaSemana)} ${sesionesEstaSemana === 1 ? 'sesión' : 'sesiones'}`}
          </Text>
        </View>
        {totalesUltimaSemana.volumenKg > 0 ? (
          <Text variant="small" tone="faint">
            {`Volumen ${kg(totalesUltimaSemana.volumenKg, 0)} kg · ${entero(totalesUltimaSemana.seriesTotales)} series`}
          </Text>
        ) : (
          <Text variant="small" tone="faint">
            Todavía no has entrenado esta semana.
          </Text>
        )}
      </Card>

      <View style={styles.filaTitulo}>
        <Text variant="overline" tone="faint">
          Mis rutinas
        </Text>
        <Button label="＋ Nueva" variant="ghost" size="sm" onPress={onNuevaRutina} />
      </View>

      {rutinas.length === 0 ? (
        <Card variant="dashed">
          <Text variant="caption" tone="muted">
            Todavía no tienes rutinas. Una rutina es una lista de ejercicios con
            sus series, para no tener que decidir nada al llegar al gimnasio.
          </Text>
          <Button label="Crear la primera" size="sm" onPress={onNuevaRutina} />
        </Card>
      ) : (
        <Card>
          {rutinas.map((r) => {
            const series = r.ejercicios.reduce((acc, x) => acc + x.seriesObj, 0);
            const xp = XP.completarEntreno + Math.round(series * XP.serieRegistrada);
            const nombres = r.ejercicios
              .map((x) => porId.get(x.ejercicioId)?.nombre)
              .filter(Boolean)
              .slice(0, 3)
              .join(' · ');

            return (
              <ListItem
                key={r.id}
                icono={r.icono}
                titulo={r.nombre}
                subtitulo={nombres || 'Sin ejercicios'}
                onPress={() => onEmpezar(r)}
                derecha={
                  <Text variant="small" weight="bold" tone="accent">
                    {`${entero(xp)} XP`}
                  </Text>
                }
              />
            );
          })}
        </Card>
      )}

      <Button
        label={`Sesión libre · +${entero(XP.completarEntreno)} XP`}
        variant="secondary"
        onPress={() => onEmpezar(null)}
      />

      {recordsRecientes.length > 0 ? (
        <>
          <Text variant="overline" tone="faint">
            Récords recientes
          </Text>
          <Card variant="warning">
            {recordsRecientes.map(({ serie, sesion }) => {
              const e = porId.get(serie.ejercicioId);
              const def = TIPOS_EJERCICIO.find((t) => t.clave === e?.tipo);
              const magnitud =
                e?.tipo === 'externo'
                  ? `${kg(serie.pesoKg ?? 0)} kg`
                  : e?.tipo === 'isometrico'
                    ? `${entero(serie.segundos ?? 0)} s`
                    : `${entero(serie.reps ?? 0)} reps`;

              return (
                <ListItem
                  key={serie.id}
                  icono="🏆"
                  titulo={`${e?.nombre ?? 'Ejercicio'} · ${magnitud}`}
                  subtitulo={`${sesion.fecha} · ${def?.nombre ?? ''}`}
                  derecha={
                    <Text variant="small" weight="bold" tone="warning">
                      PR
                    </Text>
                  }
                />
              );
            })}
          </Card>
        </>
      ) : null}

      {sesiones.length > 0 ? (
        <>
          <Text variant="overline" tone="faint">
            Últimas sesiones
          </Text>
          <Card variant="flat">
            {sesiones
              .slice()
              .reverse()
              .slice(0, 5)
              .map((s) => (
                <ListItem
                  key={s.id}
                  titulo={s.nombre}
                  subtitulo={`${s.fecha} · ${entero(s.series.length)} series`}
                  derecha={
                    <Text variant="small" tone="faint">
                      {s.volumenTotal > 0 ? `${kg(s.volumenTotal, 0)} kg` : `${entero(s.segundosIsometricos)} s`}
                    </Text>
                  }
                />
              ))}
          </Card>
        </>
      ) : null}

      <Card variant="dashed">
        <ListItem
          icono="📈"
          titulo="Progresión por ejercicio"
          subtitulo="Mejor serie, volumen, 1RM e historial"
          onPress={onProgresion}
          derecha={
            <Text variant="small" tone="accent" weight="bold">
              →
            </Text>
          }
        />
        <ListItem
          icono="🪜"
          titulo="Escaleras de progresión"
          subtitulo="Variantes con criterio de desbloqueo"
          onPress={onEscaleras}
          derecha={
            <Text variant="small" tone="accent" weight="bold">
              →
            </Text>
          }
        />
      </Card>
    </Screen>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    cabecera: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: t.spacing.md,
    },
    filaTitulo: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: t.spacing.sm,
    },
  }),
);
