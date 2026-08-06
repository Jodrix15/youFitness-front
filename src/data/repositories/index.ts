/**
 * CONTRATOS DE DATOS — la frontera entre la lógica y el almacenamiento.
 *
 * Todo lo que hay por encima (dominio, casos de uso, pantallas) habla ÚNICAMENTE
 * con estas interfaces. Nadie importa `AsyncStorage`, ni `expo-sqlite`, ni
 * `fetch`, fuera de `src/data/adapters/`.
 *
 * Por qué importa: hoy detrás hay un adaptador local. Mañana, si aparece
 * sincronización entre dispositivos, se escribe un adaptador HTTP que implemente
 * estas mismas firmas y se cambia una línea en el contenedor. Ni una pantalla ni
 * una regla de negocio se entera.
 */

import type { Checkin, NuevoCheckin } from '../../domain/models/checkin';
import type {
  Comida,
  DeslizDetalle,
  NuevaComida,
  NuevaReceta,
  NuevoDeslizDetalle,
  Receta,
} from '../../domain/models/comida';
import type { FechaISO, Uuid } from '../../domain/models/comunes';
import type { ClaveModulo, Modulo } from '../../domain/models/modulo';
import type { NuevoObjetivo, Objetivo } from '../../domain/models/objetivo';
import type { Perfil } from '../../domain/models/perfil';
import type { Medida, PesoRegistro, TipoMedida } from '../../domain/models/peso';
import type { NuevoXpEvento, XpEvento } from '../../domain/models/xp';

export type DatosNuevoPerfil = Omit<
  Perfil,
  'id' | 'usuarioId' | 'creadoEn' | 'actualizadoEn' | 'borradoEn'
>;

export interface PerfilRepository {
  /** Perfil activo, o `null` si la app aún no ha pasado por el onboarding. */
  obtener(): Promise<Perfil | null>;
  crear(datos: DatosNuevoPerfil): Promise<Perfil>;
  actualizar(id: Uuid, cambios: Partial<DatosNuevoPerfil>): Promise<Perfil>;
}

export interface ModuloRepository {
  listar(usuarioId: Uuid): Promise<Modulo[]>;
  /** Fija el conjunto exacto de módulos activos, creando los que falten. */
  establecerActivos(usuarioId: Uuid, activos: readonly ClaveModulo[]): Promise<Modulo[]>;
}

export interface ObjetivoRepository {
  listarActivos(usuarioId: Uuid): Promise<Objetivo[]>;
  crearVarios(usuarioId: Uuid, objetivos: readonly NuevoObjetivo[]): Promise<Objetivo[]>;
}

export interface PesoRepository {
  /** Todos los pesajes, de más antiguo a más reciente. */
  listar(usuarioId: Uuid): Promise<PesoRegistro[]>;
  obtenerPorFecha(usuarioId: Uuid, fecha: FechaISO): Promise<PesoRegistro | null>;
  /**
   * Guarda el pesaje del día. Si ya existe uno para esa fecha, lo sustituye.
   * Pesarse dos veces el mismo día corrige, no acumula.
   */
  guardar(
    usuarioId: Uuid,
    datos: { fecha: FechaISO; pesoKg: number; hora?: string | null; nota?: string | null },
  ): Promise<{ registro: PesoRegistro; eraNuevo: boolean }>;
  borrar(usuarioId: Uuid, id: Uuid): Promise<void>;
}

export interface MedidaRepository {
  listar(usuarioId: Uuid, tipo?: TipoMedida): Promise<Medida[]>;
  ultima(usuarioId: Uuid, tipo: TipoMedida): Promise<Medida | null>;
  guardar(
    usuarioId: Uuid,
    datos: { fecha: FechaISO; tipo: TipoMedida; valorCm: number },
  ): Promise<Medida>;
}

export interface ComidaRepository {
  listar(usuarioId: Uuid): Promise<Comida[]>;
  listarPorFecha(usuarioId: Uuid, fecha: FechaISO): Promise<Comida[]>;
  crear(usuarioId: Uuid, datos: NuevaComida): Promise<Comida>;
  actualizar(usuarioId: Uuid, id: Uuid, cambios: Partial<NuevaComida>): Promise<Comida>;
  borrar(usuarioId: Uuid, id: Uuid): Promise<void>;

  /** Detalle del desliz. Va aparte porque solo lo tienen las comidas marcadas. */
  listarDetallesDesliz(usuarioId: Uuid): Promise<DeslizDetalle[]>;
  guardarDetalleDesliz(usuarioId: Uuid, datos: NuevoDeslizDetalle): Promise<DeslizDetalle>;
}

export interface RecetaRepository {
  listar(usuarioId: Uuid): Promise<Receta[]>;
  crear(usuarioId: Uuid, datos: NuevaReceta): Promise<Receta>;
  actualizar(usuarioId: Uuid, id: Uuid, cambios: Partial<NuevaReceta>): Promise<Receta>;
  borrar(usuarioId: Uuid, id: Uuid): Promise<void>;
  /** Suma uno a `vecesUsada`. Es lo que ordena «las que más repites». */
  registrarUso(usuarioId: Uuid, id: Uuid): Promise<Receta>;
}

export interface CheckinRepository {
  listar(usuarioId: Uuid): Promise<Checkin[]>;
  obtenerPorFecha(usuarioId: Uuid, fecha: FechaISO): Promise<Checkin | null>;
  /** Uno por día: cerrar el día dos veces corrige, no acumula. */
  guardar(
    usuarioId: Uuid,
    datos: NuevoCheckin,
  ): Promise<{ registro: Checkin; eraNuevo: boolean }>;
}

/**
 * Log de XP. Solo se añade y se lee: no hay `actualizar` ni `borrar` a propósito.
 * Deshacer algo se representa con un evento compensatorio, no borrando el pasado.
 */
export interface XpRepository {
  listar(usuarioId: Uuid): Promise<XpEvento[]>;
  registrar(usuarioId: Uuid, evento: NuevoXpEvento): Promise<XpEvento>;
  /** Fechas con al menos un evento. Es lo que alimenta el cálculo de racha. */
  fechasConActividad(usuarioId: Uuid): Promise<FechaISO[]>;
}

/** Estado del onboarding y preferencias que no son datos de salud. */
export interface AjustesRepository {
  onboardingCompletado(): Promise<boolean>;
  marcarOnboardingCompletado(): Promise<void>;
  /** Solo para desarrollo: vuelve a dejar la app como recién instalada. */
  reiniciarTodo(): Promise<void>;
}

/**
 * Contenedor de repositorios. Es el único punto donde se elige la implementación.
 */
export type Repositorios = {
  perfil: PerfilRepository;
  modulos: ModuloRepository;
  objetivos: ObjetivoRepository;
  peso: PesoRepository;
  medidas: MedidaRepository;
  comidas: ComidaRepository;
  recetas: RecetaRepository;
  checkins: CheckinRepository;
  xp: XpRepository;
  ajustes: AjustesRepository;
};
