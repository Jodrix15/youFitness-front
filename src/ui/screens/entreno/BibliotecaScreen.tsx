import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  FACTORES_DE_REFERENCIA,
  GRUPOS_MUSCULARES,
  TIPOS_EJERCICIO,
  type Ejercicio,
  type GrupoMuscular,
  type NuevoEjercicio,
  type TipoEjercicio,
} from '../../../domain/models/entreno';
import {
  Aviso,
  Button,
  Card,
  Chip,
  ChipRow,
  ListItem,
  NumberField,
  Screen,
  Text,
  TextField,
} from '../../components';
import { aNumero, decimal, entero } from '../../format';
import { makeStyles } from '../../theme';

type Props = {
  ejercicios: readonly Ejercicio[];
  onCrear: (datos: NuevoEjercicio) => void;
  onBorrar: (id: string) => void;
  onAtras: () => void;
};

/**
 * Pantalla 21 · Biblioteca de ejercicios.
 *
 * Cada ejercicio declara su TIPO y su FACTOR DE APALANCAMIENTO, y no son
 * adornos: el tipo decide qué columnas tiene la tabla de series y cómo se
 * calcula el volumen; el factor, qué fracción de tu peso mueves.
 *
 * El catálogo empieza vacío a propósito. Nadie hace cuarenta ejercicios, y una
 * lista llena de cosas que no haces convierte encontrar el tuyo en un problema.
 */
export function BibliotecaScreen({ ejercicios, onCrear, onBorrar, onAtras }: Props) {
  const styles = useStyles();

  const [busqueda, setBusqueda] = useState('');
  const [creando, setCreando] = useState(false);
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<TipoEjercicio>('externo');
  const [grupo, setGrupo] = useState<GrupoMuscular>('pecho');
  const [factor, setFactor] = useState('1,0');
  const [notas, setNotas] = useState('');

  const definicion = TIPOS_EJERCICIO.find((t) => t.clave === tipo)!;

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return ejercicios;
    return ejercicios.filter((e) => e.nombre.toLowerCase().includes(q));
  }, [ejercicios, busqueda]);

  function guardar() {
    onCrear({
      nombre: nombre.trim(),
      tipo,
      grupoMuscular: grupo,
      factorApalancamiento: definicion.usaFactor ? (aNumero(factor) ?? 1) : 1,
      notas: notas.trim() || null,
    });
    setCreando(false);
    setNombre('');
    setNotas('');
    setFactor('1,0');
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
            Ejercicios
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Nuevo ejercicio"
            onPress={() => setCreando((v) => !v)}
            hitSlop={12}
          >
            <Text variant="title" tone="accent">
              {creando ? '×' : '＋'}
            </Text>
          </Pressable>
        </View>
      }
    >
      {creando ? (
        <Card variant="accent">
          <Text variant="overline" tone="faint">
            Nuevo ejercicio
          </Text>

          <TextField
            label="Nombre"
            value={nombre}
            onChangeText={setNombre}
            placeholder="Press banca"
            maxLength={50}
            autoFocus
          />

          <Text variant="overline" tone="faint">
            Tipo
          </Text>
          <View style={styles.tipos}>
            {TIPOS_EJERCICIO.map((t) => (
              <Pressable key={t.clave} onPress={() => setTipo(t.clave)} accessibilityRole="radio">
                <Card variant={tipo === t.clave ? 'accent' : 'flat'} style={styles.tipo}>
                  <Text variant="caption">{`${t.icono}  ${t.nombre}`}</Text>
                  <Text variant="small" tone="faint">
                    {t.descripcion}
                  </Text>
                </Card>
              </Pressable>
            ))}
          </View>

          <Text variant="overline" tone="faint">
            Grupo muscular
          </Text>
          <ChipRow>
            {GRUPOS_MUSCULARES.map((g) => (
              <Chip
                key={g.valor}
                label={g.etiqueta}
                selected={grupo === g.valor}
                onPress={() => setGrupo(g.valor)}
              />
            ))}
          </ChipRow>

          {definicion.usaFactor ? (
            <>
              <NumberField
                label="Factor de apalancamiento"
                value={factor}
                onChangeText={setFactor}
                unidad="× tu peso"
                maxLength={4}
              />
              <Aviso icono="📐" titulo="Qué es esto">
                {'Qué fracción de tu peso mueve el ejercicio. Sirve para comparar el volumen contigo mismo, no con nadie más. Referencias orientativas:'}
              </Aviso>
              <Card variant="flat">
                {FACTORES_DE_REFERENCIA.map((f) => (
                  <ListItem
                    key={f.nombre}
                    titulo={f.nombre}
                    derecha={
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => setFactor(decimal(f.factor, 2).replace(',00', ',0'))}
                      >
                        <Text variant="small" tone="accent" weight="bold">
                          {decimal(f.factor, 2)}
                        </Text>
                      </Pressable>
                    }
                  />
                ))}
              </Card>
            </>
          ) : null}

          <TextField
            label="Notas"
            value={notas}
            onChangeText={setNotas}
            placeholder="Agarre cerrado, banco a 30°"
            maxLength={120}
          />

          <Button label="Guardar ejercicio" onPress={guardar} disabled={nombre.trim().length === 0} />
        </Card>
      ) : null}

      {ejercicios.length === 0 && !creando ? (
        <Card variant="dashed">
          <Text variant="caption" tone="muted">
            Tu biblioteca está vacía. Da de alta los ejercicios que haces de
            verdad — con cinco o seis ya puedes entrenar.
          </Text>
          <Text variant="small" tone="faint">
            No hay catálogo precargado a propósito: una lista de cuarenta
            ejercicios que no haces solo estorba para encontrar el tuyo.
          </Text>
          <Button label="Crear el primero" size="sm" onPress={() => setCreando(true)} />
        </Card>
      ) : null}

      {ejercicios.length > 6 ? (
        <TextField
          label={`Buscar entre ${entero(ejercicios.length)} ejercicios`}
          value={busqueda}
          onChangeText={setBusqueda}
          placeholder="🔍"
        />
      ) : null}

      {filtrados.map((e) => {
        const def = TIPOS_EJERCICIO.find((t) => t.clave === e.tipo);
        return (
          <Card key={e.id}>
            <View style={styles.filaTitulo}>
              <Text variant="caption" weight="bold" style={styles.nombre}>
                {`${def?.icono ?? ''} ${e.nombre}`}
              </Text>
              <Pressable accessibilityRole="button" onPress={() => onBorrar(e.id)} hitSlop={8}>
                <Text variant="small" tone="danger">
                  Borrar
                </Text>
              </Pressable>
            </View>
            <Text variant="small" tone="faint">
              {[
                def?.nombre,
                GRUPOS_MUSCULARES.find((g) => g.valor === e.grupoMuscular)?.etiqueta,
                def?.usaFactor ? `factor ${decimal(e.factorApalancamiento, 2)}` : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </Text>
            {e.notas ? (
              <Text variant="small" tone="faint">
                {`📝 ${e.notas}`}
              </Text>
            ) : null}
          </Card>
        );
      })}
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
    tipos: { gap: t.spacing.sm },
    tipo: { paddingVertical: t.spacing.md, gap: 2 },
    filaTitulo: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: t.spacing.sm,
    },
    nombre: { flex: 1 },
  }),
);
