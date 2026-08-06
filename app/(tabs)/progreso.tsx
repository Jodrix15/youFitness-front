import { PantallaPendiente } from '../../src/ui/screens/PantallaPendiente';

export default function ProgresoRoute() {
  return (
    <PantallaPendiente
      titulo="Progreso"
      bloque="Bloques 4 y 5 · Progreso e historial"
      descripcion="Lo que has hecho, y lo que eso dice de ti."
      contenido={[
        'XP del mes y adherencia por día de la semana',
        'Objetivos, logros y retos personales',
        'Rangos, niveles y de dónde sale tu XP',
        'Historial completo: día, mes, año y todo',
      ]}
    />
  );
}
