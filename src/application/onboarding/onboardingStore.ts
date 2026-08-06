import { create } from 'zustand';

import type { ClaveModulo } from '../../domain/models/modulo';
import { MODULOS } from '../../domain/models/modulo';
import type { Sexo } from '../../domain/models/perfil';

/**
 * Borrador del onboarding: lo que el usuario lleva escrito antes de guardar.
 *
 * Vive en memoria a propósito. Nada se persiste hasta que el onboarding termina,
 * así que abandonar a medias no deja un perfil a medio hacer en la base de datos.
 *
 * Este store NO contiene reglas de negocio: solo guarda lo tecleado. Validar,
 * calcular rangos de peso o generar objetivos es cosa de `src/domain/rules`.
 */

export type PasoOnboarding = 'bienvenida' | 'perfil' | 'bloques' | 'objetivo' | 'permisos';

export const PASOS: readonly PasoOnboarding[] = [
  'bienvenida',
  'perfil',
  'bloques',
  'objetivo',
  'permisos',
] as const;

/** Los pasos numerados que ve el usuario ("Paso 2 de 4"). Bienvenida no cuenta. */
export const TOTAL_PASOS_VISIBLES = 4;

export type EstadoOnboarding = {
  nombre: string;
  pesoKg: number | null;
  alturaCm: number | null;
  edad: number | null;
  sexo: Sexo | null;
  cinturaCm: number | null;
  modulos: ClaveModulo[];
  pesoObjetivoKg: number | null;
  sesionesPorSemana: number;
  permisoPasos: boolean;
  permisoNotificaciones: boolean;
};

export type AccionesOnboarding = {
  setNombre: (v: string) => void;
  setPeso: (v: number | null) => void;
  setAltura: (v: number | null) => void;
  setEdad: (v: number | null) => void;
  setSexo: (v: Sexo) => void;
  setCintura: (v: number | null) => void;
  alternarModulo: (clave: ClaveModulo) => void;
  setPesoObjetivo: (v: number | null) => void;
  setSesionesPorSemana: (v: number) => void;
  setPermisoPasos: (v: boolean) => void;
  setPermisoNotificaciones: (v: boolean) => void;
  reiniciar: () => void;
};

const INICIAL: EstadoOnboarding = {
  nombre: '',
  pesoKg: null,
  alturaCm: null,
  edad: null,
  sexo: null,
  cinturaCm: null,
  modulos: MODULOS.filter((m) => m.activoPorDefecto).map((m) => m.clave),
  pesoObjetivoKg: null,
  sesionesPorSemana: 4,
  permisoPasos: false,
  permisoNotificaciones: false,
};

export const useOnboardingStore = create<EstadoOnboarding & AccionesOnboarding>((set) => ({
  ...INICIAL,

  setNombre: (nombre) => set({ nombre }),
  setPeso: (pesoKg) => set({ pesoKg }),
  setAltura: (alturaCm) => set({ alturaCm }),
  setEdad: (edad) => set({ edad }),
  setSexo: (sexo) => set({ sexo }),
  setCintura: (cinturaCm) => set({ cinturaCm }),

  alternarModulo: (clave) =>
    set((s) => ({
      modulos: s.modulos.includes(clave)
        ? s.modulos.filter((m) => m !== clave)
        : [...s.modulos, clave],
    })),

  setPesoObjetivo: (pesoObjetivoKg) => set({ pesoObjetivoKg }),
  setSesionesPorSemana: (sesionesPorSemana) => set({ sesionesPorSemana }),
  setPermisoPasos: (permisoPasos) => set({ permisoPasos }),
  setPermisoNotificaciones: (permisoNotificaciones) => set({ permisoNotificaciones }),

  reiniciar: () => set({ ...INICIAL }),
}));
