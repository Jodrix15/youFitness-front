import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useOnboardingStore } from '../../../application/onboarding/onboardingStore';
import type { Sexo } from '../../../domain/models/perfil';
import {
  alturaValida,
  cinturaValida,
  edadValida,
  interpretarCintura,
  pesoValido,
  ratioCinturaAltura,
  rangoPesoSaludable,
  RATIO_CINTURA_ALTURA_OBJETIVO,
} from '../../../domain/rules/composicion';
import {
  Aviso,
  Button,
  Card,
  NumberField,
  Screen,
  SegmentedControl,
  StepHeader,
  Text,
  type Segment,
} from '../../components';
import { aNumero, decimal, kg } from '../../format';
import { makeStyles } from '../../theme';

type Props = {
  onContinuar: () => void;
  onAtras: () => void;
};

const SEXOS: readonly Segment<Sexo>[] = [
  { value: 'hombre', label: 'Hombre' },
  { value: 'mujer', label: 'Mujer' },
];

/**
 * Pantalla 02 · Perfil.
 *
 * CAMBIO FRENTE AL MOCKUP: fuera el nivel de actividad y la estimación de
 * calorías. §10 de la especificación los descarta — solo servían para estimar
 * el gasto calórico, que la app ya no calcula. En su lugar, cintura: es el
 * mejor indicador disponible junto a la altura.
 *
 * La pantalla solo edita texto y pinta. Todo el cálculo (rango sano, ratio
 * cintura/altura, validaciones) viene de `domain/rules/composicion`.
 */
export function PerfilScreen({ onContinuar, onAtras }: Props) {
  const styles = useStyles();
  const store = useOnboardingStore();

  const [peso, setPeso] = useState(store.pesoKg == null ? '' : String(store.pesoKg).replace('.', ','));
  const [altura, setAltura] = useState(store.alturaCm == null ? '' : String(store.alturaCm));
  const [edad, setEdad] = useState(store.edad == null ? '' : String(store.edad));
  const [cintura, setCintura] = useState(store.cinturaCm == null ? '' : String(store.cinturaCm));

  const pesoNum = aNumero(peso);
  const alturaNum = aNumero(altura);
  const edadNum = aNumero(edad);
  const cinturaNum = aNumero(cintura);

  const rango = alturaNum != null && alturaValida(alturaNum) ? rangoPesoSaludable(alturaNum) : null;

  const ratio =
    cinturaNum != null && alturaNum != null && cinturaValida(cinturaNum) && alturaValida(alturaNum)
      ? ratioCinturaAltura(cinturaNum, alturaNum)
      : null;

  const completo =
    pesoNum != null &&
    pesoValido(pesoNum) &&
    alturaNum != null &&
    alturaValida(alturaNum) &&
    store.sexo != null &&
    (edadNum == null || edadValida(edadNum));

  function continuar() {
    store.setPeso(pesoNum);
    store.setAltura(alturaNum);
    store.setEdad(edadNum);
    store.setCintura(cinturaNum);
    onContinuar();
  }

  return (
    <Screen
      header={<StepHeader paso={1} total={4} onBack={onAtras} />}
      footer={<Button label="Continuar" onPress={continuar} disabled={!completo} />}
    >
      <View style={styles.intro}>
        <Text variant="displaySm">Hablemos de ti</Text>
        <Text variant="caption" tone="muted">
          Puedes cambiarlo todo después.
        </Text>
      </View>

      <NumberField
        label="Peso actual"
        value={peso}
        onChangeText={setPeso}
        unidad="kg"
        destacado
        autoFocus
      />

      <View style={styles.dos}>
        <View style={styles.mitad}>
          <NumberField
            label="Altura"
            value={altura}
            onChangeText={setAltura}
            unidad="cm"
            allowDecimal={false}
            maxLength={3}
          />
        </View>
        <View style={styles.mitad}>
          <NumberField
            label="Edad"
            value={edad}
            onChangeText={setEdad}
            unidad="años"
            allowDecimal={false}
            maxLength={3}
          />
        </View>
      </View>

      <Card>
        <Text variant="overline" tone="faint">
          Sexo biológico
        </Text>
        <Text variant="small" tone="faint">
          Solo afecta a los rangos de referencia.
        </Text>
        <SegmentedControl segments={SEXOS} value={store.sexo} onChange={store.setSexo} />
      </Card>

      <NumberField
        label="Cintura (opcional)"
        value={cintura}
        onChangeText={setCintura}
        unidad="cm"
        allowDecimal={false}
        maxLength={3}
      />

      {rango ? (
        <Card variant="accent">
          <Text variant="overline" tone="faint">
            Tu rango de peso saludable
          </Text>
          <Text variant="displaySm" tone="accent">
            {`${kg(rango.minKg)} – ${kg(rango.maxKg)} kg`}
          </Text>
          <Text variant="small" tone="muted">
            Corresponde a un IMC de 18,5 a 24,9 para {altura} cm.
          </Text>
        </Card>
      ) : null}

      {ratio != null ? (
        <Card variant={interpretarCintura(cinturaNum!, alturaNum!) === 'bajo_umbral' ? 'accent' : 'warning'}>
          <Text variant="overline" tone="faint">
            Cintura / altura
          </Text>
          <Text variant="displaySm">{decimal(ratio, 2)}</Text>
          <Text variant="small" tone="muted">
            {`La referencia es mantenerlo por debajo de ${decimal(RATIO_CINTURA_ALTURA_OBJETIVO, 2)}.`}
          </Text>
        </Card>
      ) : null}

      <Aviso icono="⚠️">
        El IMC no distingue músculo de grasa, así que si entrenas fuerza puede
        marcarte alto sin motivo. El mejor indicador que puedes medir en casa es
        la cintura dividida entre tu altura.
      </Aviso>
    </Screen>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    intro: { gap: t.spacing.xs },
    dos: { flexDirection: 'row', gap: t.spacing.md },
    mitad: { flex: 1 },
  }),
);
