import { diasHastaProximoCumple } from "./dates";

export type ClienteDashboard = {
  id: string;
  nombre_completo: string;
  fecha_nacimiento: string | null;
  telefono: string | null;
  ultima_visita_at: string | null;
  sellos_actuales: number;
  activo: boolean;
};

export type PremioDashboard = {
  id: string;
  nombre: string;
  sellos_requeridos: number;
  activo: boolean;
};

export type ClienteCumpleanos = ClienteDashboard & {
  dias_para_cumple: number;
};

export type ClientePremioProximo = ClienteDashboard & {
  premio_nombre: string;
  sellos_requeridos: number;
  sellos_faltantes: number;
};

export type ClienteInactivo = ClienteDashboard & {
  dias_inactivo: number;
};

export function obtenerCumpleanosProximos(
  clientes: ClienteDashboard[],
  diasLimite = 7
): ClienteCumpleanos[] {
  return clientes
    .map((cliente) => ({
      ...cliente,
      dias_para_cumple: diasHastaProximoCumple(cliente.fecha_nacimiento),
    }))
    .filter(
      (cliente): cliente is ClienteDashboard & { dias_para_cumple: number } =>
        cliente.dias_para_cumple !== null &&
        cliente.dias_para_cumple >= 0 &&
        cliente.dias_para_cumple <= diasLimite
    )
    .sort((a, b) => a.dias_para_cumple - b.dias_para_cumple);
}

export function obtenerClientesConPremioProximo(
  clientes: ClienteDashboard[],
  premios: PremioDashboard[]
): ClientePremioProximo[] {
  const premiosActivos = premios
    .filter((premio) => premio.activo)
    .sort((a, b) => a.sellos_requeridos - b.sellos_requeridos);

  return clientes
    .map((cliente) => {
      const siguientePremio = premiosActivos.find(
        (premio) => cliente.sellos_actuales < premio.sellos_requeridos
      );

      if (!siguientePremio) return null;

      const faltan = siguientePremio.sellos_requeridos - cliente.sellos_actuales;

      if (faltan > 2) return null;

      return {
        ...cliente,
        premio_nombre: siguientePremio.nombre,
        sellos_requeridos: siguientePremio.sellos_requeridos,
        sellos_faltantes: faltan,
      };
    })
    .filter((cliente): cliente is ClientePremioProximo => cliente !== null)
    .sort((a, b) => a.sellos_faltantes - b.sellos_faltantes);
}

export function obtenerClientesInactivos(
  clientes: ClienteDashboard[],
  minimoDias = 15,
  maximoDias = 30
): ClienteInactivo[] {
  const hoy = new Date();

  return clientes
    .map((cliente) => {
      if (!cliente.ultima_visita_at) return null;

      const ultimaVisita = new Date(cliente.ultima_visita_at);
      const diffMs = hoy.getTime() - ultimaVisita.getTime();
      const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (dias < minimoDias || dias > maximoDias) return null;

      return {
        ...cliente,
        dias_inactivo: dias,
      };
    })
    .filter((cliente): cliente is ClienteInactivo => cliente !== null)
    .sort((a, b) => b.dias_inactivo - a.dias_inactivo);
}