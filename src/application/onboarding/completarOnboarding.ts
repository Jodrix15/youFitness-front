import type { Perfil } from '../../domain/models/perfil';
import { PERFIL_POR_DEFECTO } from '../../domain/models/perfil';
import { generarObjetivosIniciales } from '../../domain/rules/objetivosIniciales';
import type { Repositorios } from '../../data/repositories';
import type { EstadoOnboarding } from './onboardingStore';

/**
 * CASO DE USO: terminar el onboarding.
 *
 * Orquesta dominio y datos, sin saber nada de React ni de pantallas. Se podría
 * llamar desde un test, desde un script o desde otra interfaz distinta.
 *
 * Escribe en este orden: perfil → módulos → objetivos → marca de completado.
 * La marca va la última a propósito: si algo falla por el camino, el onboarding
 * se repite en lugar de dejar la app en un estado a medias.
 *
 * Si YA EXISTE un perfil, se actualiza en lugar de crear otro. Crear uno nuevo
 * generaría un `usuarioId` distinto y dejaría huérfanos los pesajes y el XP
 * anteriores, que seguirían en la base de datos apuntando a un usuario que ya
 * nadie consulta.
 */
export async function completarOnboarding(
  repos: Repositorios,
  borrador: EstadoOnboarding,
): Promise<Perfil> {
  const { nombre, pesoKg, alturaCm, edad, sexo, cinturaCm, modulos } = borrador;

  if (!nombre.trim()) throw new Error('Falta el nombre');
  if (pesoKg == null) throw new Error('Falta el peso');
  if (alturaCm == null) throw new Error('Falta la altura');
  if (sexo == null) throw new Error('Falta el sexo biológico');

  const existente = await repos.perfil.obtener();

  const datos = {
    nombre: nombre.trim(),
    fechaNacimiento: null,
    edad,
    alturaCm,
    sexo,
    pesoInicialKg: pesoKg,
    cinturaCm,
    ...PERFIL_POR_DEFECTO,
  };

  const perfil = existente
    ? await repos.perfil.actualizar(existente.id, datos)
    : await repos.perfil.crear(datos);

  await repos.modulos.establecerActivos(perfil.usuarioId, modulos);

  if (borrador.pesoObjetivoKg != null) {
    const objetivos = generarObjetivosIniciales({
      pesoActualKg: pesoKg,
      pesoObjetivoKg: borrador.pesoObjetivoKg,
      sesionesPorSemana: borrador.sesionesPorSemana,
      modulosActivos: modulos,
    });
    await repos.objetivos.crearVarios(perfil.usuarioId, objetivos);
  }

  await repos.ajustes.marcarOnboardingCompletado();

  return perfil;
}
