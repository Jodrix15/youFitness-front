import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { TIPOS_COMIDA, type Comida } from '../../../domain/models/comida';
import type { EstadoComidas } from '../../../application/comida/useComidas';
import type { Tendencia } from '../../../domain/rules/tendenciaPeso';
import { hoy } from '../../../domain/rules/fechas';
import {
  BarraComposicion,
  BotonIcono,
  Card,
  InsigniasPorciones,
  ListItem,
  Screen,
  SelectorFecha,
  Text,
} from '../../components';
import { conSigno, entero, fechaLarga } from '../../format';
import { makeStyles } from '../../theme';

type Props = {
  estado: EstadoComidas;
  tendencia: Tendencia;
  onAnadir: (tipo?: string) => void;
  onEditar: (comidaId: string) => void;
  onDesliz: () => void;
  onRecetas: () => void;
};

/**
 * Pantalla 11 · Diario de comidas.
 *
 * Sin anillo de calorías ni barras de macros: composición del día en raciones y
 * racha de días completos.
 *
 * El desliz aparece en ESTE MISMO timeline, marcado, no en una lista aparte. Es
 * lo que permite verlo en contexto: qué comiste antes, a qué hora, y si sustituyó
 * una comida o se sumó.
 */
export function DiarioScreen({
  estado,
  tendencia,
  onAnadir,
  onEditar,
  onDesliz,
  onRecetas,
}: Props) {
  const styles = useStyles();
  const { dia, rachaCompletos, presupuesto } = estado;
  const [calendarioAbierto, setCalendarioAbierto] = useState(false);

  const registradas = dia.comidas.filter((c) => !c.esDesliz);
  const esHoy = dia.fecha === hoy();

  // Días que tienen algo registrado, para marcarlos con un punto en el calendario.
  const fechasConComidas = useMemo(
    () => new Set(estado.todas.map((c) => c.fecha)),
    [estado.todas],
  );

  return (
    <Screen>
      <View style={styles.cabecera}>
        <View style={styles.titulo}>
          <Text variant="displaySm">Comida</Text>
          <Text variant="small" tone={esHoy ? 'faint' : 'accent'}>
            {esHoy ? fechaLarga(new Date(dia.fecha)) : `↩ ${fechaLarga(new Date(dia.fecha))}`}
          </Text>
        </View>
        <BotonIcono icono="📖" etiqueta="Mis recetas" onPress={onRecetas} />
        <BotonIcono
          icono="📅"
          etiqueta="Elegir día"
          onPress={() => setCalendarioAbierto(true)}
          activo={!esHoy}
        />
      </View>

      <SelectorFecha
        visible={calendarioAbierto}
        seleccionada={dia.fecha}
        hoy={hoy()}
        conDatos={fechasConComidas}
        onSeleccionar={estado.irADia}
        onCerrar={() => setCalendarioAbierto(false)}
      />

      <Card variant="accent">
        <View style={styles.filaTitulo}>
          <Text variant="overline" tone="faint">
            Composición de hoy
          </Text>
          <Text variant="small" weight="bold" tone={dia.completo ? 'accent' : 'muted'}>
            {`${entero(dia.principalesRegistradas)} de 3 comidas`}
          </Text>
        </View>

        <View style={styles.barras}>
          <BarraComposicion
            icono="✋"
            nombre="Proteína"
            detalle={dia.proteina.detalle}
            valor={dia.proteina.progreso}
          />
          <BarraComposicion
            icono="✊"
            nombre="Verdura"
            detalle={dia.verdura.detalle}
            valor={dia.verdura.progreso}
          />
          <BarraComposicion
            icono="🤲"
            nombre="Hidratos"
            detalle={dia.hidratos.detalle}
            valor={dia.hidratos.progreso}
            tono="warning"
          />
        </View>

        <View style={styles.separador} />

        <View style={styles.filaTitulo}>
          <Text variant="small" tone="faint">
            {dia.faltan.length === 0
              ? 'Día completo'
              : `Falta ${dia.faltan.map(etiqueta).join(' y ')}`}
          </Text>
          {rachaCompletos > 0 ? (
            <Text variant="small" weight="bold" tone="accent">
              {`🔥 ${entero(rachaCompletos)} días completos`}
            </Text>
          ) : null}
        </View>
      </Card>

      {registradas.length === 0 && dia.comidas.length === 0 ? (
        <Card variant="dashed">
          <Text variant="caption" tone="muted">
            {esHoy
              ? 'Aún no has registrado nada hoy. Cada comida son cinco segundos: qué comiste y la forma del plato.'
              : 'Ese día no registraste nada. Todavía puedes añadirlo: se guardará con la fecha que estás viendo.'}
          </Text>
        </Card>
      ) : null}

      {dia.comidas.map((c) => (
        <FilaComida key={c.id} comida={c} onEditar={() => onEditar(c.id)} />
      ))}

      {dia.faltan.map((tipo) => (
        <Card key={tipo} variant="dashed">
          <ListItem
            icono={TIPOS_COMIDA.find((t) => t.valor === tipo)?.icono}
            titulo={`${etiqueta(tipo)} · sin registrar`}
            onPress={() => onAnadir(tipo)}
            derecha={
              <Text variant="small" weight="bold" tone="accent">
                Añadir →
              </Text>
            }
          />
        </Card>
      ))}

      {/* Rosa, no dorado: el dorado es para avisos, el rosa para deslices. */}
      <Card variant="danger">
        <ListItem
          icono="🍩"
          titulo="¿Se te ha escapado algo?"
          subtitulo={`Llevas ${entero(presupuesto.usados)} de ${entero(presupuesto.presupuesto)} de tu presupuesto semanal`}
          onPress={onDesliz}
          derecha={
            <Text variant="small" weight="bold" tone="danger">
              Anotar →
            </Text>
          }
        />
      </Card>

      {tendencia.estado === 'lista' && tendencia.cambioSemanalKg != null ? (
        <Card variant="flat">
          <View style={styles.filaPeso}>
            <Text style={styles.iconoPeso}>⚖️</Text>
            <Text variant="small" tone="muted" style={styles.textoPeso}>
              {tendencia.cambioSemanalKg <= 0
                ? `Tu tendencia baja ${conSigno(-tendencia.cambioSemanalKg, 2)} kg esta semana. La cantidad que comes es la correcta: no hace falta contar nada.`
                : `Tu tendencia sube ${conSigno(tendencia.cambioSemanalKg, 2)} kg esta semana. Sin contar nada: prueba a bajar una ración de hidratos al día.`}
            </Text>
          </View>
        </Card>
      ) : null}
    </Screen>
  );
}

function FilaComida({ comida, onEditar }: { comida: Comida; onEditar: () => void }) {
  const styles = useStyles();
  const meta = TIPOS_COMIDA.find((t) => t.valor === comida.tipo);

  return (
    <View style={styles.bloqueComida}>
      <View style={styles.filaTitulo}>
        <Text variant="overline" tone="faint">
          {`${etiqueta(comida.tipo)}${comida.hora ? ` · ${comida.hora}` : ''}`}
        </Text>
        {comida.editadoEn ? (
          <Text variant="small" tone="faint">
            editado
          </Text>
        ) : null}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Editar ${comida.descripcion}`}
        onPress={onEditar}
        style={({ pressed }) => (pressed ? { opacity: 0.8 } : null)}
      >
        <Card variant={comida.esDesliz ? 'danger' : 'default'}>
          <View style={styles.filaTitulo}>
            <Text variant="caption" weight="bold" style={styles.descripcion}>
              {`${meta?.icono ?? ''} ${comida.descripcion}`}
            </Text>
            {comida.esDesliz ? (
              <Text variant="small" weight="bold" tone="danger">
                desliz
              </Text>
            ) : (
              <Text variant="small" tone="accent">
                ✎
              </Text>
            )}
          </View>

          <InsigniasPorciones comida={comida} />

          {comida.nota ? (
            <Text variant="small" tone="faint">
              {comida.nota}
            </Text>
          ) : null}
        </Card>
      </Pressable>
    </View>
  );
}

function etiqueta(tipo: string): string {
  return TIPOS_COMIDA.find((t) => t.valor === tipo)?.etiqueta ?? tipo;
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    cabecera: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: t.spacing.md,
    },
    titulo: { gap: 2 },
    filaTitulo: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: t.spacing.sm,
    },
    barras: { gap: t.spacing.md, marginTop: t.spacing.xs },
    separador: {
      height: 1,
      backgroundColor: t.colors.border,
      marginVertical: t.spacing.xs,
    },
    bloqueComida: { gap: t.spacing.sm },
    descripcion: { flex: 1 },
    filaPeso: { flexDirection: 'row', gap: t.spacing.md, alignItems: 'center' },
    iconoPeso: { fontSize: 18, lineHeight: 24 },
    textoPeso: { flex: 1 },
  }),
);
