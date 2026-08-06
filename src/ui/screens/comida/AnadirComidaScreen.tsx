import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  CARAS_SACIEDAD,
  GRUPOS,
  TIPOS_COMIDA,
  type Comida,
  type Receta,
  type TipoComida,
} from '../../../domain/models/comida';
import { XP } from '../../../domain/rules/xp';
import {
  Button,
  Card,
  Chip,
  ChipRow,
  ContadorPorciones,
  EscalaEmoji,
  ListItem,
  Screen,
  SegmentedControl,
  Text,
  TextField,
  type Segment,
} from '../../components';
import { entero } from '../../format';
import { makeStyles } from '../../theme';

type Porciones = { prot: number; verd: number; hidr: number; gras: number };

type Props = {
  tipoInicial?: TipoComida;
  /** Comida existente que se está corrigiendo. `null` para una nueva. */
  edicion?: Comida | null;
  recetas: readonly Receta[];
  guardando: boolean;
  mensaje: string | null;
  onGuardar: (datos: {
    tipo: TipoComida;
    descripcion: string;
    porciones: Porciones;
    saciedad: number | null;
    recetaId: string | null;
  }) => void;
  onGuardarComoReceta: (datos: { nombre: string; porciones: Porciones }) => void;
  onBorrar?: () => void;
  onCancelar: () => void;
};

const SEGMENTOS: readonly Segment<TipoComida>[] = TIPOS_COMIDA.map((t) => ({
  value: t.valor,
  label: t.etiqueta,
}));

/**
 * Pantalla 12 · Registrar una comida.
 *
 * Cinco segundos, sin buscar alimentos ni pesar nada. Se registra la FORMA del
 * plato, que es lo único sobre lo que puedes actuar mañana.
 *
 * No hay base de datos de alimentos (§10): serían gigas en local o una API con
 * red. Con quince recetas propias se cubre casi todo lo que se come.
 */
export function AnadirComidaScreen({
  tipoInicial = 'comida',
  edicion = null,
  recetas,
  guardando,
  mensaje,
  onGuardar,
  onGuardarComoReceta,
  onBorrar,
  onCancelar,
}: Props) {
  const styles = useStyles();

  const [tipo, setTipo] = useState<TipoComida>(edicion?.tipo ?? tipoInicial);
  const [descripcion, setDescripcion] = useState(edicion?.descripcion ?? '');
  const [porciones, setPorciones] = useState<Porciones>({
    prot: edicion?.protPorciones ?? 0,
    verd: edicion?.verdPorciones ?? 0,
    hidr: edicion?.hidrPorciones ?? 0,
    gras: edicion?.grasPorciones ?? 0,
  });
  const [saciedad, setSaciedad] = useState<number | null>(edicion?.saciedad ?? null);
  const [recetaId, setRecetaId] = useState<string | null>(edicion?.recetaId ?? null);
  const [verRecetas, setVerRecetas] = useState(false);

  const puedeGuardar = descripcion.trim().length > 0;
  const tieneComposicion = Object.values(porciones).some((v) => v > 0);

  function aplicarReceta(r: Receta) {
    setDescripcion(r.nombre);
    setPorciones({
      prot: r.protPorciones,
      verd: r.verdPorciones,
      hidr: r.hidrPorciones,
      gras: r.grasPorciones,
    });
    setRecetaId(r.id);
    setVerRecetas(false);
  }

  const clavePorcion: Record<string, keyof Porciones> = {
    protPorciones: 'prot',
    verdPorciones: 'verd',
    hidrPorciones: 'hidr',
    grasPorciones: 'gras',
  };

  return (
    <Screen
      header={
        <View style={styles.barra}>
          {/* Volver descarta lo escrito: nada se guarda hasta pulsar Guardar. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver sin guardar"
            onPress={onCancelar}
            hitSlop={12}
          >
            <Text variant="title" tone="accent">
              ←
            </Text>
          </Pressable>
          <Text variant="title" style={styles.tituloBarra}>
            {edicion ? 'Corregir comida' : 'Añadir comida'}
          </Text>
        </View>
      }
      footer={
        <>
          {mensaje ? (
            <Text variant="small" tone="accent" center>
              {mensaje}
            </Text>
          ) : null}
          <Button
            label={edicion ? 'Guardar cambios' : `Guardar · +${entero(XP.registrarComida)} XP`}
            onPress={() =>
              onGuardar({ tipo, descripcion: descripcion.trim(), porciones, saciedad, recetaId })
            }
            disabled={!puedeGuardar}
            loading={guardando}
          />
        </>
      }
    >
      <SegmentedControl segments={SEGMENTOS} value={tipo} onChange={setTipo} />

      <Card>
        <TextField
          label="¿Qué has comido?"
          value={descripcion}
          onChangeText={(v) => {
            setDescripcion(v);
            // Si editas el texto a mano, deja de ser «esa receta».
            if (recetaId) setRecetaId(null);
          }}
          placeholder="Pollo con arroz y ensalada"
          maxLength={80}
        />
        {recetas.length > 0 ? (
          <ChipRow>
            <Chip
              label="📖 Desde una receta"
              selected={verRecetas}
              onPress={() => setVerRecetas((v) => !v)}
            />
          </ChipRow>
        ) : null}
      </Card>

      {verRecetas ? (
        <Card variant="flat">
          <Text variant="overline" tone="faint">
            Tus recetas
          </Text>
          {recetas.map((r) => (
            <ListItem
              key={r.id}
              icono={r.icono}
              titulo={r.nombre}
              subtitulo={r.ingredientes}
              onPress={() => aplicarReceta(r)}
              derecha={
                <Text variant="small" tone="accent" weight="bold">
                  Usar
                </Text>
              }
            />
          ))}
        </Card>
      ) : null}

      <Card variant="accent">
        <Text variant="overline" tone="faint">
          Composición del plato
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
      </Card>

      <Card variant="flat">
        <Text variant="overline" tone="faint">
          Cómo se mide
        </Text>
        {GRUPOS.map((g) => (
          <View key={g.clave} style={styles.leyenda}>
            <Text style={styles.iconoLeyenda}>{g.icono}</Text>
            <Text variant="small" tone="muted" style={styles.textoLeyenda}>
              {g.ejemplos}
            </Text>
          </View>
        ))}
        <Text variant="small" tone="faint">
          Tu mano escala con tu cuerpo, así que la medida se ajusta sola. No es
          exacta, pero es consistente — y eso es lo que hace falta.
        </Text>
      </Card>

      <Card>
        <Text variant="overline" tone="faint">
          Al terminar de comer…
        </Text>
        <EscalaEmoji
          opciones={CARAS_SACIEDAD}
          valor={saciedad}
          onChange={setSaciedad}
          etiquetaAccesible="Saciedad"
        />
        <View style={styles.extremos}>
          <Text variant="small" tone="faint">
            con hambre
          </Text>
          <Text variant="small" tone="faint">
            saciado
          </Text>
          <Text variant="small" tone="faint">
            demasiado
          </Text>
        </View>
      </Card>

      {edicion && onBorrar ? (
        <Card variant="dashed">
          <ListItem
            icono="🗑️"
            titulo="Eliminar esta comida"
            subtitulo="Desaparece del diario. El XP que dio se queda: no se devuelve."
            onPress={onBorrar}
            derecha={
              <Text variant="small" tone="danger" weight="bold">
                Borrar
              </Text>
            }
          />
        </Card>
      ) : null}

      {puedeGuardar && tieneComposicion && !recetaId && !edicion ? (
        <Card variant="dashed">
          <ListItem
            icono="💾"
            titulo="Guardar como receta"
            subtitulo="Para registrarlo de un toque la próxima vez"
            onPress={() => onGuardarComoReceta({ nombre: descripcion.trim(), porciones })}
            derecha={
              <Text variant="small" tone="accent" weight="bold">
                →
              </Text>
            }
          />
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
    leyenda: { flexDirection: 'row', gap: t.spacing.md, alignItems: 'flex-start' },
    iconoLeyenda: { fontSize: 15, lineHeight: 20 },
    textoLeyenda: { flex: 1 },
    extremos: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
  }),
);
