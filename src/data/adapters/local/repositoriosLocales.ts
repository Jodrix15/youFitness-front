/**
 * Adaptador local. Implementa los contratos de `src/data/repositories`.
 *
 * ESTE ES EL ÚNICO SITIO DE LA APP que sabe cómo se guardan los datos. Si
 * mañana esto pasa a SQLite o a una API, se sustituye este fichero y nada más.
 *
 * Nota sobre el motor: para el Bloque 1 los datos son diminutos (un perfil,
 * cinco módulos, tres objetivos), así que clave-valor sobra y funciona idéntico
 * en móvil, iPad y web. Cuando lleguen el historial y sus consultas por rango de
 * fechas, se añade un adaptador SQLite que implemente estas mismas interfaces.
 */

import type { Uuid } from '../../../domain/models/comunes';
import { MODULOS, type ClaveModulo, type Modulo } from '../../../domain/models/modulo';
import type { NuevoObjetivo, Objetivo } from '../../../domain/models/objetivo';
import type { Perfil } from '../../../domain/models/perfil';
import type { Medida, PesoRegistro, TipoMedida } from '../../../domain/models/peso';
import type { FechaISO } from '../../../domain/models/comunes';
import type { Checkin, NuevoCheckin } from '../../../domain/models/checkin';
import type { Ejercicio, Rutina, Sesion } from '../../../domain/models/entreno';
import type { Escalera } from '../../../domain/models/escalera';
import type {
  Comida,
  DeslizDetalle,
  NuevaComida,
  NuevaReceta,
  NuevoDeslizDetalle,
  Receta,
} from '../../../domain/models/comida';
import type { NuevoXpEvento, XpEvento } from '../../../domain/models/xp';
import { ordenarPorFecha } from '../../../domain/rules/fechas';
import { ahora, type FuenteDeIds } from '../../../platform/reloj';
import type { Almacen } from '../../../platform/almacen';
import type {
  AjustesRepository,
  CheckinRepository,
  ComidaRepository,
  DatosNuevoPerfil,
  EjercicioRepository,
  EscaleraRepository,
  MedidaRepository,
  ModuloRepository,
  ObjetivoRepository,
  PerfilRepository,
  PesoRepository,
  RecetaRepository,
  Repositorios,
  RutinaRepository,
  SesionRepository,
  XpRepository,
} from '../../repositories';

const CLAVES = {
  perfil: 'perfil',
  modulos: 'modulos',
  objetivos: 'objetivos',
  pesajes: 'pesajes',
  medidas: 'medidas',
  checkins: 'checkins',
  comidas: 'comidas',
  deslices: 'deslices_detalle',
  recetas: 'recetas',
  ejercicios: 'ejercicios',
  rutinas: 'rutinas',
  sesiones: 'sesiones',
  escaleras: 'escaleras',
  xp: 'xp_eventos',
  onboarding: 'ajustes:onboarding_completado',
} as const;

export function crearRepositoriosLocales(almacen: Almacen, ids: FuenteDeIds): Repositorios {
  const nuevoId = () => ids.nuevoId();

  const perfil: PerfilRepository = {
    async obtener() {
      const p = await almacen.leer<Perfil>(CLAVES.perfil);
      return p && p.borradoEn == null ? p : null;
    },

    async crear(datos: DatosNuevoPerfil) {
      const t = ahora();
      const registro: Perfil = {
        ...datos,
        id: nuevoId(),
        // Sin cuentas todavía: el usuario es local y su id se genera aquí. El
        // día que haya sincronización, este campo pasa a venir del servidor y
        // no hay que tocar ni el modelo ni las pantallas.
        usuarioId: nuevoId(),
        creadoEn: t,
        actualizadoEn: t,
        borradoEn: null,
      };
      await almacen.escribir(CLAVES.perfil, registro);
      return registro;
    },

    async actualizar(id: Uuid, cambios: Partial<DatosNuevoPerfil>) {
      const actual = await almacen.leer<Perfil>(CLAVES.perfil);
      if (!actual || actual.id !== id) {
        throw new Error('No hay perfil que actualizar');
      }
      const registro: Perfil = { ...actual, ...cambios, actualizadoEn: ahora() };
      await almacen.escribir(CLAVES.perfil, registro);
      return registro;
    },
  };

  const modulos: ModuloRepository = {
    async listar(usuarioId: Uuid) {
      const lista = (await almacen.leer<Modulo[]>(CLAVES.modulos)) ?? [];
      return lista.filter((m) => m.usuarioId === usuarioId && m.borradoEn == null);
    },

    async establecerActivos(usuarioId: Uuid, activos: readonly ClaveModulo[]) {
      const previos = (await almacen.leer<Modulo[]>(CLAVES.modulos)) ?? [];
      const t = ahora();

      const registros: Modulo[] = MODULOS.map((def) => {
        const previo = previos.find((m) => m.usuarioId === usuarioId && m.clave === def.clave);
        const activo = activos.includes(def.clave);
        if (previo) {
          return previo.activo === activo ? previo : { ...previo, activo, actualizadoEn: t };
        }
        return {
          id: nuevoId(),
          usuarioId,
          clave: def.clave,
          activo,
          creadoEn: t,
          actualizadoEn: t,
          borradoEn: null,
        };
      });

      const otros = previos.filter((m) => m.usuarioId !== usuarioId);
      await almacen.escribir(CLAVES.modulos, [...otros, ...registros]);
      return registros;
    },
  };

  const objetivos: ObjetivoRepository = {
    async listarActivos(usuarioId: Uuid) {
      const lista = (await almacen.leer<Objetivo[]>(CLAVES.objetivos)) ?? [];
      return lista.filter((o) => o.usuarioId === usuarioId && o.activo && o.borradoEn == null);
    },

    async crearVarios(usuarioId: Uuid, nuevos: readonly NuevoObjetivo[]) {
      const previos = (await almacen.leer<Objetivo[]>(CLAVES.objetivos)) ?? [];
      const t = ahora();

      const registros: Objetivo[] = nuevos.map((o) => ({
        ...o,
        cumplidoEn: o.cumplidoEn ?? null,
        id: nuevoId(),
        usuarioId,
        creadoEn: t,
        actualizadoEn: t,
        borradoEn: null,
      }));

      await almacen.escribir(CLAVES.objetivos, [...previos, ...registros]);
      return registros;
    },
  };

  const peso: PesoRepository = {
    async listar(usuarioId) {
      const lista = (await almacen.leer<PesoRegistro[]>(CLAVES.pesajes)) ?? [];
      return ordenarPorFecha(
        lista.filter((p) => p.usuarioId === usuarioId && p.borradoEn == null),
      );
    },

    async obtenerPorFecha(usuarioId, fecha) {
      const lista = (await almacen.leer<PesoRegistro[]>(CLAVES.pesajes)) ?? [];
      return (
        lista.find(
          (p) => p.usuarioId === usuarioId && p.fecha === fecha && p.borradoEn == null,
        ) ?? null
      );
    },

    async guardar(usuarioId, datos) {
      const lista = (await almacen.leer<PesoRegistro[]>(CLAVES.pesajes)) ?? [];
      const t = ahora();
      const previo = lista.find(
        (p) => p.usuarioId === usuarioId && p.fecha === datos.fecha && p.borradoEn == null,
      );

      // Un pesaje por día: el segundo del día corrige al primero. La fecha es
      // única por usuario, así que aquí se sustituye en lugar de acumular.
      const registro: PesoRegistro = previo
        ? {
            ...previo,
            pesoKg: datos.pesoKg,
            hora: datos.hora ?? previo.hora,
            nota: datos.nota ?? previo.nota,
            actualizadoEn: t,
          }
        : {
            id: nuevoId(),
            usuarioId,
            fecha: datos.fecha,
            pesoKg: datos.pesoKg,
            hora: datos.hora ?? null,
            nota: datos.nota ?? null,
            creadoEn: t,
            actualizadoEn: t,
            borradoEn: null,
          };

      const resto = lista.filter((p) => p.id !== registro.id);
      await almacen.escribir(CLAVES.pesajes, [...resto, registro]);

      return { registro, eraNuevo: previo == null };
    },

    async borrar(usuarioId, id) {
      const lista = (await almacen.leer<PesoRegistro[]>(CLAVES.pesajes)) ?? [];
      // Borrado lógico: nunca se saca la fila. Especificación §4.
      const siguiente = lista.map((p) =>
        p.id === id && p.usuarioId === usuarioId
          ? { ...p, borradoEn: ahora(), actualizadoEn: ahora() }
          : p,
      );
      await almacen.escribir(CLAVES.pesajes, siguiente);
    },
  };

  async function listarMedidas(usuarioId: string, tipo?: TipoMedida): Promise<Medida[]> {
    const lista = (await almacen.leer<Medida[]>(CLAVES.medidas)) ?? [];
    return ordenarPorFecha(
      lista.filter(
        (m) => m.usuarioId === usuarioId && m.borradoEn == null && (tipo == null || m.tipo === tipo),
      ),
    );
  }

  const medidas: MedidaRepository = {
    listar: listarMedidas,

    async ultima(usuarioId, tipo) {
      const lista = await listarMedidas(usuarioId, tipo);
      return lista[lista.length - 1] ?? null;
    },

    async guardar(usuarioId, datos) {
      const lista = (await almacen.leer<Medida[]>(CLAVES.medidas)) ?? [];
      const t = ahora();
      const previo = lista.find(
        (m) =>
          m.usuarioId === usuarioId &&
          m.fecha === datos.fecha &&
          m.tipo === datos.tipo &&
          m.borradoEn == null,
      );

      const registro: Medida = previo
        ? { ...previo, valorCm: datos.valorCm, actualizadoEn: t }
        : {
            id: nuevoId(),
            usuarioId,
            fecha: datos.fecha,
            tipo: datos.tipo,
            valorCm: datos.valorCm,
            creadoEn: t,
            actualizadoEn: t,
            borradoEn: null,
          };

      await almacen.escribir(CLAVES.medidas, [
        ...lista.filter((m) => m.id !== registro.id),
        registro,
      ]);
      return registro;
    },
  };

  const comidas: ComidaRepository = {
    async listar(usuarioId) {
      const lista = (await almacen.leer<Comida[]>(CLAVES.comidas)) ?? [];
      return ordenarPorFecha(
        lista.filter((c) => c.usuarioId === usuarioId && c.borradoEn == null),
      );
    },

    async listarPorFecha(usuarioId, fecha) {
      const lista = (await almacen.leer<Comida[]>(CLAVES.comidas)) ?? [];
      return lista
        .filter((c) => c.usuarioId === usuarioId && c.fecha === fecha && c.borradoEn == null)
        .sort((a, b) => (a.hora ?? '').localeCompare(b.hora ?? ''));
    },

    async crear(usuarioId, datos: NuevaComida) {
      const lista = (await almacen.leer<Comida[]>(CLAVES.comidas)) ?? [];
      const t = ahora();

      const registro: Comida = {
        ...datos,
        id: nuevoId(),
        usuarioId,
        creadoEn: t,
        actualizadoEn: t,
        borradoEn: null,
      };

      await almacen.escribir(CLAVES.comidas, [...lista, registro]);
      return registro;
    },

    async actualizar(usuarioId, id, cambios) {
      const lista = (await almacen.leer<Comida[]>(CLAVES.comidas)) ?? [];
      const previo = lista.find((c) => c.id === id && c.usuarioId === usuarioId);
      if (!previo) throw new Error('No existe esa comida');

      const t = ahora();
      // `editadoEn` deja constancia de que la fila se tocó después: el historial
      // marca las entradas editadas para que no parezcan el registro original.
      const registro: Comida = { ...previo, ...cambios, actualizadoEn: t, editadoEn: t };

      await almacen.escribir(CLAVES.comidas, [...lista.filter((c) => c.id !== id), registro]);
      return registro;
    },

    async borrar(usuarioId, id) {
      const lista = (await almacen.leer<Comida[]>(CLAVES.comidas)) ?? [];
      const t = ahora();
      await almacen.escribir(
        CLAVES.comidas,
        lista.map((c) =>
          c.id === id && c.usuarioId === usuarioId ? { ...c, borradoEn: t, actualizadoEn: t } : c,
        ),
      );
    },

    async listarDetallesDesliz(usuarioId) {
      const lista = (await almacen.leer<DeslizDetalle[]>(CLAVES.deslices)) ?? [];
      return lista.filter((d) => d.usuarioId === usuarioId && d.borradoEn == null);
    },

    async guardarDetalleDesliz(usuarioId, datos: NuevoDeslizDetalle) {
      const lista = (await almacen.leer<DeslizDetalle[]>(CLAVES.deslices)) ?? [];
      const t = ahora();
      const previo = lista.find(
        (d) => d.usuarioId === usuarioId && d.comidaId === datos.comidaId && d.borradoEn == null,
      );

      const registro: DeslizDetalle = previo
        ? { ...previo, ...datos, actualizadoEn: t }
        : {
            ...datos,
            id: nuevoId(),
            usuarioId,
            creadoEn: t,
            actualizadoEn: t,
            borradoEn: null,
          };

      await almacen.escribir(CLAVES.deslices, [
        ...lista.filter((d) => d.id !== registro.id),
        registro,
      ]);
      return registro;
    },
  };

  const recetas: RecetaRepository = {
    async listar(usuarioId) {
      const lista = (await almacen.leer<Receta[]>(CLAVES.recetas)) ?? [];
      return lista
        .filter((r) => r.usuarioId === usuarioId && r.borradoEn == null)
        .sort((a, b) => b.vecesUsada - a.vecesUsada || a.nombre.localeCompare(b.nombre));
    },

    async crear(usuarioId, datos: NuevaReceta) {
      const lista = (await almacen.leer<Receta[]>(CLAVES.recetas)) ?? [];
      const t = ahora();

      const registro: Receta = {
        ...datos,
        vecesUsada: datos.vecesUsada ?? 0,
        id: nuevoId(),
        usuarioId,
        creadoEn: t,
        actualizadoEn: t,
        borradoEn: null,
      };

      await almacen.escribir(CLAVES.recetas, [...lista, registro]);
      return registro;
    },

    async actualizar(usuarioId, id, cambios) {
      const lista = (await almacen.leer<Receta[]>(CLAVES.recetas)) ?? [];
      const previo = lista.find((r) => r.id === id && r.usuarioId === usuarioId);
      if (!previo) throw new Error('No existe esa receta');

      const registro: Receta = { ...previo, ...cambios, actualizadoEn: ahora() };
      await almacen.escribir(CLAVES.recetas, [...lista.filter((r) => r.id !== id), registro]);
      return registro;
    },

    async borrar(usuarioId, id) {
      const lista = (await almacen.leer<Receta[]>(CLAVES.recetas)) ?? [];
      const t = ahora();
      await almacen.escribir(
        CLAVES.recetas,
        lista.map((r) =>
          r.id === id && r.usuarioId === usuarioId ? { ...r, borradoEn: t, actualizadoEn: t } : r,
        ),
      );
    },

    async registrarUso(usuarioId, id) {
      const lista = (await almacen.leer<Receta[]>(CLAVES.recetas)) ?? [];
      const previo = lista.find((r) => r.id === id && r.usuarioId === usuarioId);
      if (!previo) throw new Error('No existe esa receta');

      const registro: Receta = {
        ...previo,
        vecesUsada: previo.vecesUsada + 1,
        actualizadoEn: ahora(),
      };
      await almacen.escribir(CLAVES.recetas, [...lista.filter((r) => r.id !== id), registro]);
      return registro;
    },
  };

  /**
   * Ayudante para colecciones con el mismo ciclo de vida: leer, crear,
   * actualizar y borrar lógicamente, todo filtrado por usuario.
   *
   * Aparece a partir del bloque de entrenamiento porque ahí ya son tres
   * repositorios idénticos salvo por el tipo. Repetirlo tres veces más era
   * garantizar que uno de ellos olvidara el `borradoEn`.
   */
  function coleccion<T extends { id: string; usuarioId: string; borradoEn: string | null; creadoEn: string; actualizadoEn: string }>(
    clave: string,
  ) {
    const todos = async (): Promise<T[]> => (await almacen.leer<T[]>(clave)) ?? [];

    return {
      async listar(usuarioId: string): Promise<T[]> {
        return (await todos()).filter((x) => x.usuarioId === usuarioId && x.borradoEn == null);
      },

      async crear(usuarioId: string, datos: object): Promise<T> {
        const lista = await todos();
        const t = ahora();
        const registro = {
          ...datos,
          id: nuevoId(),
          usuarioId,
          creadoEn: t,
          actualizadoEn: t,
          borradoEn: null,
        } as T;
        await almacen.escribir(clave, [...lista, registro]);
        return registro;
      },

      async actualizar(usuarioId: string, id: string, cambios: object): Promise<T> {
        const lista = await todos();
        const previo = lista.find((x) => x.id === id && x.usuarioId === usuarioId);
        if (!previo) throw new Error(`No existe el registro ${id} en ${clave}`);

        const registro = { ...previo, ...cambios, actualizadoEn: ahora() } as T;
        await almacen.escribir(clave, [...lista.filter((x) => x.id !== id), registro]);
        return registro;
      },

      async borrar(usuarioId: string, id: string): Promise<void> {
        const lista = await todos();
        const t = ahora();
        await almacen.escribir(
          clave,
          lista.map((x) =>
            x.id === id && x.usuarioId === usuarioId ? { ...x, borradoEn: t, actualizadoEn: t } : x,
          ),
        );
      },
    };
  }

  const baseEjercicios = coleccion<Ejercicio>(CLAVES.ejercicios);
  const ejercicios: EjercicioRepository = {
    async listar(usuarioId) {
      const lista = await baseEjercicios.listar(usuarioId);
      return lista.sort((a, b) => a.nombre.localeCompare(b.nombre));
    },
    crear: (usuarioId, datos) => baseEjercicios.crear(usuarioId, datos),
    actualizar: (usuarioId, id, cambios) => baseEjercicios.actualizar(usuarioId, id, cambios),
    borrar: (usuarioId, id) => baseEjercicios.borrar(usuarioId, id),
  };

  const baseRutinas = coleccion<Rutina>(CLAVES.rutinas);
  const rutinas: RutinaRepository = {
    async listar(usuarioId) {
      const lista = await baseRutinas.listar(usuarioId);
      return lista.sort((a, b) => b.vecesUsada - a.vecesUsada || a.nombre.localeCompare(b.nombre));
    },
    crear: (usuarioId, datos) => baseRutinas.crear(usuarioId, { vecesUsada: 0, ...datos }),
    actualizar: (usuarioId, id, cambios) => baseRutinas.actualizar(usuarioId, id, cambios),
    borrar: (usuarioId, id) => baseRutinas.borrar(usuarioId, id),
    async registrarUso(usuarioId, id) {
      const lista = await baseRutinas.listar(usuarioId);
      const previa = lista.find((r) => r.id === id);
      if (!previa) throw new Error('No existe esa rutina');
      return baseRutinas.actualizar(usuarioId, id, { vecesUsada: previa.vecesUsada + 1 });
    },
  };

  const baseSesiones = coleccion<Sesion>(CLAVES.sesiones);
  const sesiones: SesionRepository = {
    async listar(usuarioId) {
      return ordenarPorFecha(await baseSesiones.listar(usuarioId));
    },
    async obtener(usuarioId, id) {
      const lista = await baseSesiones.listar(usuarioId);
      return lista.find((s) => s.id === id) ?? null;
    },
    async enCurso(usuarioId) {
      const lista = await baseSesiones.listar(usuarioId);
      // Solo puede haber una a la vez; si hubiera varias por un fallo, gana la
      // más reciente y las demás quedan ahí sin estorbar.
      return lista.filter((s) => !s.terminada).sort((a, b) => (a.creadoEn < b.creadoEn ? 1 : -1))[0] ?? null;
    },
    crear: (usuarioId, datos) => baseSesiones.crear(usuarioId, datos),
    actualizar: (usuarioId, id, cambios) => baseSesiones.actualizar(usuarioId, id, cambios),
    borrar: (usuarioId, id) => baseSesiones.borrar(usuarioId, id),
    async seriesHistoricas(usuarioId) {
      const lista = await baseSesiones.listar(usuarioId);
      return lista.filter((s) => s.terminada).flatMap((s) => s.series);
    },
  };

  const baseEscaleras = coleccion<Escalera>(CLAVES.escaleras);
  const escaleras: EscaleraRepository = {
    listar: (usuarioId) => baseEscaleras.listar(usuarioId),
    crear: (usuarioId, datos) => baseEscaleras.crear(usuarioId, datos),
    actualizar: (usuarioId, id, cambios) => baseEscaleras.actualizar(usuarioId, id, cambios),
    borrar: (usuarioId, id) => baseEscaleras.borrar(usuarioId, id),
  };

  const checkins: CheckinRepository = {
    async listar(usuarioId) {
      const lista = (await almacen.leer<Checkin[]>(CLAVES.checkins)) ?? [];
      return ordenarPorFecha(
        lista.filter((c) => c.usuarioId === usuarioId && c.borradoEn == null),
      );
    },

    async obtenerPorFecha(usuarioId, fecha) {
      const lista = (await almacen.leer<Checkin[]>(CLAVES.checkins)) ?? [];
      return (
        lista.find(
          (c) => c.usuarioId === usuarioId && c.fecha === fecha && c.borradoEn == null,
        ) ?? null
      );
    },

    async guardar(usuarioId, datos: NuevoCheckin) {
      const lista = (await almacen.leer<Checkin[]>(CLAVES.checkins)) ?? [];
      const t = ahora();
      const previo = lista.find(
        (c) => c.usuarioId === usuarioId && c.fecha === datos.fecha && c.borradoEn == null,
      );

      const registro: Checkin = previo
        ? { ...previo, ...datos, actualizadoEn: t }
        : {
            ...datos,
            id: nuevoId(),
            usuarioId,
            creadoEn: t,
            actualizadoEn: t,
            borradoEn: null,
          };

      await almacen.escribir(CLAVES.checkins, [
        ...lista.filter((c) => c.id !== registro.id),
        registro,
      ]);

      return { registro, eraNuevo: previo == null };
    },
  };

  const xp: XpRepository = {
    async listar(usuarioId) {
      const lista = (await almacen.leer<XpEvento[]>(CLAVES.xp)) ?? [];
      return ordenarPorFecha(lista.filter((e) => e.usuarioId === usuarioId));
    },

    async registrar(usuarioId, evento: NuevoXpEvento) {
      const lista = (await almacen.leer<XpEvento[]>(CLAVES.xp)) ?? [];
      const t = ahora();

      const registro: XpEvento = {
        ...evento,
        id: nuevoId(),
        usuarioId,
        creadoEn: t,
        actualizadoEn: t,
        borradoEn: null,
      };

      await almacen.escribir(CLAVES.xp, [...lista, registro]);
      return registro;
    },

    async fechasConActividad(usuarioId) {
      const lista = (await almacen.leer<XpEvento[]>(CLAVES.xp)) ?? [];
      const fechas = lista
        .filter((e) => e.usuarioId === usuarioId && e.xpFinal > 0)
        .map((e) => e.fecha as FechaISO);
      return [...new Set(fechas)].sort();
    },
  };

  const ajustes: AjustesRepository = {
    async onboardingCompletado() {
      return (await almacen.leer<boolean>(CLAVES.onboarding)) === true;
    },
    async marcarOnboardingCompletado() {
      await almacen.escribir(CLAVES.onboarding, true);
    },
    async reiniciarTodo() {
      await Promise.all(Object.values(CLAVES).map((c) => almacen.borrar(c)));
    },
  };

  return {
    perfil,
    modulos,
    objetivos,
    peso,
    medidas,
    comidas,
    recetas,
    ejercicios,
    rutinas,
    sesiones,
    escaleras,
    checkins,
    xp,
    ajustes,
  };
}
