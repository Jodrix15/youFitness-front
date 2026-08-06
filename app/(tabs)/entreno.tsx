import { PantallaPendiente } from '../../src/ui/screens/PantallaPendiente';

export default function EntrenoRoute() {
  return (
    <PantallaPendiente
      titulo="Entreno"
      bloque="Bloque 4 · Entrenamiento"
      descripcion="Gimnasio y calistenia, con los cinco tipos de ejercicio."
      contenido={[
        'Sesión con peso externo y calculadora de discos',
        'Sesión de calistenia, con lastre e isométricos',
        'Progresión y récords',
        'Escaleras de variantes con criterio de desbloqueo',
      ]}
    />
  );
}
