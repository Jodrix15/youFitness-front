import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { GRUPOS, ICONOS_RECETA, type Receta } from '../../../domain/models/comida';
import {
  Button,
  Card,
  Chip,
  ChipRow,
  ContadorPorciones,
  InsigniasPorciones,
  ListItem,
  Screen,
  Text,
  TextField,
} from '../../components';
import { entero } from '../../format';
import { makeStyles } from '../../theme';

type Porciones = { prot: number; verd: number; hidr: number; gras: number };

type Props = {
  recetas: readonly Receta[];
  onUsar: (receta: Receta) => void;
  onCrear: (datos: {
    nombre: string;
    icono: string;
    ingredientes: string;
    notas: string | null;
    porciones: Porciones;
  }) => void;
  onBorrar: (id: string) => void;
  onAtras: () => void;
};

/**
 * Pantalla 13 · Mis recetas.
 *
 * Una receta es una combinación con nombre que se registra de un toque. Los
 * ingredientes son texto libre: sin macros que dividir, se queda en lo útil.
 *
 * Sin pasos, sin fotos y sin temporizadores (§10). Eso es un recetario, que es
 * otra app; aquí un campo de notas cubre casi todo el valor.
 */
export function RecetasScreen({ recetas, onUsar, onCrear, onBorrar, onAtras }: Props) {
  const styles = useStyles();

  const [busqueda, setBusqueda] = useState('');
  const [creando, setCreando] = useState(false);
  const [nombre, setNombre] = useState('');
  const [icono, setIcono] = useState<string>(ICONOS_RECETA[0]);
  const [ingredientes, setIngredientes] = useState('');
  const [notas, setNotas] = useState('');
  const [porciones, setPorciones] = useState<Porciones>({ prot: 0, verd: 0, hidr: 0, gras: 0 });

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return recetas;
    return recetas.filter(
      (r) => r.nombre.toLowerCase().includes(q) || r.ingredientes.toLowerCase().includes(q),
    );
  }, [recetas, busqueda]);

  const masUsadas = useMemo(
    () => [...recetas].filter((r) => r.vecesUsada > 0).slice(0, 3),
    [recetas],
  );

  const clavePorcion: Record<string, keyof Porciones> = {
    protPorciones: 'prot',
    verdPorciones: 'verd',
    hidrPorciones: 'hidr',
    grasPorciones: 'gras',
  };

  function crear() {
    onCrear({
      nombre: nombre.trim(),
      icono,
      ingredientes: ingredientes.trim(),
      notas: notas.trim() || null,
      porciones,
    });
    setCreando(false);
    setNombre('');
    setIngredientes('');
    setNotas('');
    setPorciones({ prot: 0, verd: 0, hidr: 0, gras: 0 });
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
            Mis recetas
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Nueva receta"
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
            Nueva receta
          </Text>

          <TextField
            label="Nombre"
            value={nombre}
            onChangeText={setNombre}
            placeholder="Lentejas con verduras"
            maxLength={50}
          />

          <Text variant="overline" tone="faint">
            Icono
          </Text>
          <ChipRow>
            {ICONOS_RECETA.map((i) => (
              <Chip key={i} label={i} selected={icono === i} onPress={() => setIcono(i)} />
            ))}
          </ChipRow>

          <TextField
            label="Ingredientes"
            value={ingredientes}
            onChangeText={setIngredientes}
            placeholder="Lentejas, zanahoria, puerro, tomate"
            maxLength={140}
            ayuda="Texto libre. No hace falta cantidad ni peso."
          />

          <TextField
            label="Notas"
            value={notas}
            onChangeText={setNotas}
            placeholder="Olla rápida, 12 min desde que pita"
            maxLength={140}
          />

          <Text variant="overline" tone="faint">
            Composición de una ración
          </Text>
          {GRUPOS.map((g) => {
            const clave = clavePorcion[g.campo]!;
            return (
              <ContadorPorciones
                key={g.clave}
                icono={g.icono}
                nombre={g.nombre}
                medida={g.medida}
                valor={porciones[clave]}
                onChange={(v) => setPorciones((p) => ({ ...p, [clave]: v }))}
              />
            );
          })}

          <Button label="Guardar receta" onPress={crear} disabled={nombre.trim().length === 0} />
        </Card>
      ) : null}

      {recetas.length === 0 && !creando ? (
        <Card variant="dashed">
          <Text variant="caption" tone="muted">
            Todavía no tienes recetas. Con quince guardadas, registrar una comida
            es un toque — porque casi siempre comes lo mismo.
          </Text>
          <Button label="Crear la primera" size="sm" onPress={() => setCreando(true)} />
        </Card>
      ) : null}

      {recetas.length > 3 ? (
        <TextField
          label={`Buscar entre ${entero(recetas.length)} recetas`}
          value={busqueda}
          onChangeText={setBusqueda}
          placeholder="🔍"
        />
      ) : null}

      {filtradas.map((r) => (
        <Card key={r.id}>
          <View style={styles.filaTitulo}>
            <Text variant="caption" weight="bold" style={styles.nombre}>
              {`${r.icono} ${r.nombre}`}
            </Text>
            {r.vecesUsada > 0 ? (
              <Text variant="small" tone="faint">
                {`${entero(r.vecesUsada)} ${r.vecesUsada === 1 ? 'vez' : 'veces'}`}
              </Text>
            ) : null}
          </View>

          <InsigniasPorciones
            comida={{
              protPorciones: r.protPorciones,
              verdPorciones: r.verdPorciones,
              hidrPorciones: r.hidrPorciones,
              grasPorciones: r.grasPorciones,
            }}
          />

          {r.ingredientes ? (
            <Text variant="small" tone="faint">
              {r.ingredientes}
            </Text>
          ) : null}
          {r.notas ? (
            <Text variant="small" tone="faint">
              {`📝 ${r.notas}`}
            </Text>
          ) : null}

          <View style={styles.acciones}>
            <Button label="Registrar" size="sm" onPress={() => onUsar(r)} style={styles.crecer} />
            <Button label="Borrar" variant="secondary" size="sm" onPress={() => onBorrar(r.id)} />
          </View>
        </Card>
      ))}

      {masUsadas.length > 0 ? (
        <Card variant="flat">
          <Text variant="overline" tone="faint">
            Las que más repites
          </Text>
          {masUsadas.map((r) => (
            <ListItem
              key={r.id}
              titulo={`${r.icono} ${r.nombre}`}
              derecha={
                <Text variant="small" weight="bold">
                  {`${entero(r.vecesUsada)} veces`}
                </Text>
              }
            />
          ))}
          <Text variant="small" tone="faint">
            Comes casi siempre lo mismo. Eso no es un problema: es lo que hace que
            registrar cueste un toque.
          </Text>
        </Card>
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
    filaTitulo: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: t.spacing.sm,
    },
    nombre: { flex: 1 },
    acciones: { flexDirection: 'row', gap: t.spacing.md, marginTop: t.spacing.xs },
    crecer: { flex: 1 },
  }),
);
