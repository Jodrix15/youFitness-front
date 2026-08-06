import { CampoGrande } from './CampoGrande';

type Props = {
  label: string;
  /** `HH:MM`, o texto parcial mientras se escribe. */
  value: string;
  onChangeText: (v: string) => void;
  ayuda?: string;
};

const HORA_VALIDA = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Campo de hora en formato 24 h.
 *
 * Se escribe en lugar de usar el selector nativo: la rueda de iOS exige tres
 * gestos para poner una hora que ya sabes, y este check-in tiene que durar
 * treinta segundos.
 *
 * Comparte `CampoGrande` con los campos numéricos, así que se ve exactamente
 * igual que el de al lado. Lo único propio es la máscara: los dos puntos se
 * insertan solos al llegar al tercer dígito.
 */
export function CampoHora({ label, value, onChangeText, ayuda }: Props) {
  function alEscribir(texto: string) {
    const digitos = texto.replace(/\D/g, '').slice(0, 4);
    onChangeText(
      digitos.length <= 2 ? digitos : `${digitos.slice(0, 2)}:${digitos.slice(2)}`,
    );
  }

  return (
    <CampoGrande
      label={label}
      value={value}
      onChangeText={alEscribir}
      placeholder="23:50"
      keyboardType="number-pad"
      inputMode="numeric"
      maxLength={5}
      valido={HORA_VALIDA.test(value)}
      ayuda={ayuda}
    />
  );
}
