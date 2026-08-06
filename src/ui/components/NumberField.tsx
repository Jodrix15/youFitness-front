import { CampoGrande } from './CampoGrande';

type Props = {
  label: string;
  /** Texto crudo tecleado, con coma decimal. El padre lo convierte a número. */
  value: string;
  onChangeText: (v: string) => void;
  unidad: string;
  allowDecimal?: boolean;
  maxLength?: number;
  destacado?: boolean;
  autoFocus?: boolean;
  ayuda?: string;
};

/**
 * Campo numérico. Un input normal: al tocarlo se abre el teclado del sistema.
 *
 * Se probó con teclado propio y botones +/− (como en los mockups) y sobraba: en
 * el móvil el teclado numérico ya aparece solo, y en iPad y web se escribe con
 * el teclado de verdad. Dos formas de introducir el mismo número es una de más.
 *
 * Aquí solo vive el filtrado de pulsaciones. El aspecto lo pone `CampoGrande`,
 * compartido con el campo de hora para que se vean idénticos.
 */
export function NumberField({
  label,
  value,
  onChangeText,
  unidad,
  allowDecimal = true,
  maxLength = 6,
  destacado = false,
  autoFocus = false,
  ayuda,
}: Props) {
  function alEscribir(texto: string) {
    // El teclado decimal de iOS puede emitir punto según la configuración
    // regional del dispositivo. Se normaliza a coma, que es lo que se muestra.
    const normalizado = texto.replace('.', ',');
    const permitido = allowDecimal ? /[^0-9,]/g : /[^0-9]/g;
    let limpio = normalizado.replace(permitido, '');

    // Una sola coma, y nunca al principio.
    const primera = limpio.indexOf(',');
    if (primera === 0) limpio = limpio.slice(1);
    else if (primera > -1) {
      limpio = limpio.slice(0, primera + 1) + limpio.slice(primera + 1).replace(/,/g, '');
    }

    onChangeText(limpio.slice(0, maxLength));
  }

  return (
    <CampoGrande
      label={label}
      value={value}
      onChangeText={alEscribir}
      unidad={unidad}
      keyboardType={allowDecimal ? 'decimal-pad' : 'number-pad'}
      inputMode={allowDecimal ? 'decimal' : 'numeric'}
      maxLength={maxLength}
      destacado={destacado}
      valido={value.length > 0}
      autoFocus={autoFocus}
      ayuda={ayuda}
    />
  );
}
