import { format } from "date-fns";
import { es } from "date-fns/locale";

export function formatearFecha(fecha?: string | null) {
  if (!fecha) return "-";
  return format(new Date(fecha), "dd/MM/yyyy", { locale: es });
}

export function formatearFechaLarga(fecha?: string | null) {
  if (!fecha) return "-";
  return format(new Date(fecha), "d 'de' MMMM 'de' yyyy", { locale: es });
}

export function diasHastaProximoCumple(fechaNacimiento?: string | null) {
  if (!fechaNacimiento) return null;

  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);

  const cumpleEsteAnio = new Date(
    hoy.getFullYear(),
    nacimiento.getMonth(),
    nacimiento.getDate()
  );

  const cumpleProximoAnio = new Date(
    hoy.getFullYear() + 1,
    nacimiento.getMonth(),
    nacimiento.getDate()
  );

  const proximoCumple =
    cumpleEsteAnio >= new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
      ? cumpleEsteAnio
      : cumpleProximoAnio;

  const diffMs =
    proximoCumple.getTime() -
    new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).getTime();

  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}