import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import html2canvas from "html2canvas";
import {
  actualizarCliente,
  agregarSelloCliente,
  canjearPremioCliente,
  obtenerCanjesCliente,
  obtenerClientePorId,
  obtenerMovimientosCliente,
  obtenerPremiosPorEmpresa,
} from "../features/clientes/clientesService";
import { useAuth } from "../features/auth/AuthContext";
import { formatearFecha, formatearFechaLarga } from "../lib/dates";
import { obtenerEmpresaPorId } from "../features/configuracion/configuracionService";

type Cliente = {
  id: string;
  empresa_id: string;
  nombre_completo: string;
  fecha_nacimiento: string | null;
  telefono: string;
  notas: string | null;
  acepta_whatsapp: boolean;
  ultima_visita_at: string | null;
  sellos_actuales: number;
  sellos_historicos: number;
  ciclo_tarjeta: number;
};

type Premio = {
  id: string;
  nombre: string;
  descripcion: string | null;
  sellos_requeridos: number;
  activo: boolean;
};

type Movimiento = {
  id: string;
  tipo: string;
  cantidad: number;
  descripcion: string | null;
  created_at: string;
};

type Canje = {
  id: string;
  premio_id: string;
  ciclo_tarjeta: number;
  sellos_descontados: number;
  observacion: string | null;
  created_at: string;
};

type Empresa = {
  id: string;
  nombre: string;
  nombre_comercial: string | null;
  nombre_tarjeta: string | null;
  telefono: string | null;
  color_primario: string | null;
  color_secundario: string | null;
  logo_url: string | null;
  icono_sello: string | null;
};

export default function ClienteDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const tarjetaRef = useRef<HTMLDivElement | null>(null);
  const tarjetaExportRef = useRef<HTMLDivElement | null>(null);

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [premios, setPremios] = useState<Premio[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [canjes, setCanjes] = useState<Canje[]>([]);
  const [loading, setLoading] = useState(true);
  const [accionLoading, setAccionLoading] = useState(false);
  const [compartiendo, setCompartiendo] = useState(false);

  const [editando, setEditando] = useState(false);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [nombreEdit, setNombreEdit] = useState("");
  const [telefonoEdit, setTelefonoEdit] = useState("");
  const [fechaEdit, setFechaEdit] = useState("");
  const [notasEdit, setNotasEdit] = useState("");

  async function cargarTodo() {
    if (!id || !profile?.empresa_id) return;

    setLoading(true);

    const [
      { data: clienteData, error: clienteError },
      { data: premiosData, error: premiosError },
      { data: movimientosData, error: movimientosError },
      { data: canjesData, error: canjesError },
      { data: empresaData, error: empresaError },
    ] = await Promise.all([
      obtenerClientePorId(id),
      obtenerPremiosPorEmpresa(profile.empresa_id),
      obtenerMovimientosCliente(id),
      obtenerCanjesCliente(id),
      obtenerEmpresaPorId(profile.empresa_id),
    ]);

    if (clienteError) console.error("Error cargando cliente:", clienteError);
    if (premiosError) console.error("Error cargando premios:", premiosError);
    if (movimientosError) console.error("Error cargando movimientos:", movimientosError);
    if (canjesError) console.error("Error cargando canjes:", canjesError);
    if (empresaError) console.error("Error cargando empresa:", empresaError);

    setCliente((clienteData as Cliente) || null);
    setPremios((premiosData as Premio[]) || []);
    setMovimientos((movimientosData as Movimiento[]) || []);
    setCanjes((canjesData as Canje[]) || []);
    setEmpresa((empresaData as Empresa) || null);
    setLoading(false);
  }

  useEffect(() => {
    void cargarTodo();
  }, [id, profile?.empresa_id]);

  const premiosDisponibles = useMemo(() => {
    if (!cliente) return [];

    return premios.filter((premio) => {
      const yaCanjeadoEnEsteCiclo = canjes.some(
        (canje) =>
          canje.premio_id === premio.id &&
          canje.ciclo_tarjeta === cliente.ciclo_tarjeta
      );

      return (
        cliente.sellos_actuales >= premio.sellos_requeridos &&
        !yaCanjeadoEnEsteCiclo
      );
    });
  }, [cliente, premios, canjes]);

  const siguientePremio = useMemo(() => {
    if (!cliente) return null;

    return premios.find((premio) => {
      const yaCanjeadoEnEsteCiclo = canjes.some(
        (canje) =>
          canje.premio_id === premio.id &&
          canje.ciclo_tarjeta === cliente.ciclo_tarjeta
      );

      return (
        cliente.sellos_actuales < premio.sellos_requeridos &&
        !yaCanjeadoEnEsteCiclo
      );
    });
  }, [cliente, premios, canjes]);

  const faltanParaSiguiente = useMemo(() => {
    if (!cliente || !siguientePremio) return null;
    return siguientePremio.sellos_requeridos - cliente.sellos_actuales;
  }, [cliente, siguientePremio]);

  const colorPrimario = empresa?.color_primario || "#D9AEB2";
  const colorSecundario = empresa?.color_secundario || "#F4E7E7";
  const nombreEmpresa =
    empresa?.nombre_comercial || empresa?.nombre || "Mi Empresa";
  const nombreTarjeta = empresa?.nombre_tarjeta || "Tarjeta de fidelidad";
  const iconoSello = empresa?.icono_sello || "✿";

  function iniciarEdicion() {
    if (!cliente) return;

    setNombreEdit(cliente.nombre_completo || "");
    setTelefonoEdit(cliente.telefono || "");
    setFechaEdit(cliente.fecha_nacimiento || "");
    setNotasEdit(cliente.notas || "");
    setEditando(true);
  }

  function cancelarEdicion() {
    setEditando(false);
    setNombreEdit("");
    setTelefonoEdit("");
    setFechaEdit("");
    setNotasEdit("");
  }

  async function guardarEdicion() {
    if (!cliente) return;

    if (!nombreEdit.trim()) {
      alert("El nombre es obligatorio");
      return;
    }

    setGuardandoEdicion(true);

    const { error } = await actualizarCliente(cliente.id, {
      nombre_completo: nombreEdit.trim(),
      telefono: telefonoEdit.trim(),
      fecha_nacimiento: fechaEdit || null,
      notas: notasEdit || null,
    });

    setGuardandoEdicion(false);

    if (error) {
      alert("Error al actualizar cliente: " + error.message);
      return;
    }

    alert("Cliente actualizado correctamente");
    cancelarEdicion();
    await cargarTodo();
  }

  async function handleAgregarSello() {
    if (!cliente || !profile?.empresa_id || !user?.id) {
      alert("Faltan datos para agregar sello");
      return;
    }

    setAccionLoading(true);

    const { error } = await agregarSelloCliente({
      cliente_id: cliente.id,
      empresa_id: profile.empresa_id,
      realizado_por: user.id,
      sellos_actuales: cliente.sellos_actuales,
      sellos_historicos: cliente.sellos_historicos,
    });

    setAccionLoading(false);

    if (error) {
      alert("Error al agregar sello: " + error.message);
      return;
    }

    await cargarTodo();
  }

  async function handleCanjearPremio() {
    if (!cliente || !profile?.empresa_id || !user?.id) {
      alert("Faltan datos para canjear");
      return;
    }

    if (premiosDisponibles.length === 0) {
      alert("Este cliente no tiene premios disponibles para canjear.");
      return;
    }

    let premioElegido: Premio | null = null;

    if (premiosDisponibles.length === 1) {
      premioElegido = premiosDisponibles[0];
    } else {
      const opciones = premiosDisponibles
        .map(
          (premio, index) =>
            `${index + 1}. ${premio.nombre} (${premio.sellos_requeridos} sellos)`
        )
        .join("\n");

      const seleccion = window.prompt(
        `Este cliente puede canjear más de un premio.\n\n${opciones}\n\nEscribe el número del premio a canjear:`
      );

      if (!seleccion) return;

      const indice = Number(seleccion) - 1;

      if (
        Number.isNaN(indice) ||
        indice < 0 ||
        indice >= premiosDisponibles.length
      ) {
        alert("Selección inválida");
        return;
      }

      premioElegido = premiosDisponibles[indice];
    }

    const premioFinal = [...premios].sort(
      (a, b) => b.sellos_requeridos - a.sellos_requeridos
    )[0];

    const esPremioFinal =
      premioElegido.sellos_requeridos === premioFinal.sellos_requeridos;

    const confirmar = window.confirm(
      esPremioFinal
        ? `¿Deseas canjear "${premioElegido.nombre}"? Esta acción reiniciará la tarjeta a 0.`
        : `¿Deseas canjear "${premioElegido.nombre}"? Este canje NO reiniciará la tarjeta.`
    );

    if (!confirmar) return;

    setAccionLoading(true);

    const { error } = await canjearPremioCliente({
      cliente_id: cliente.id,
      empresa_id: profile.empresa_id,
      premio_id: premioElegido.id,
      realizado_por: user.id,
      sellos_actuales: cliente.sellos_actuales,
      sellos_requeridos: premioElegido.sellos_requeridos,
      sellos_requeridos_premio_final: premioFinal.sellos_requeridos,
      ciclo_tarjeta: cliente.ciclo_tarjeta,
      observacion: `Canje de premio: ${premioElegido.nombre}`,
    });

    setAccionLoading(false);

    if (error) {
      alert("Error al canjear premio: " + error.message);
      return;
    }

    await cargarTodo();
  }

  async function handleCompartirTarjeta() {
    if (!tarjetaExportRef.current || !cliente) {
      alert("No se pudo generar la tarjeta");
      return;
    }

    try {
      setCompartiendo(true);

      const canvas = await html2canvas(tarjetaExportRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        allowTaint: false,
      });

      const image = canvas.toDataURL("image/png");

      const link = document.createElement("a");
      link.href = image;
      link.download = `tarjeta-${cliente.nombre_completo
        .toLowerCase()
        .replace(/\s+/g, "-")}.png`;
      link.click();

      const numeroLimpio = (cliente.telefono || "").replace(/\D/g, "");
      const mensaje = `Hola ${cliente.nombre_completo} 😊

Aquí está tu ${nombreTarjeta.toLowerCase()} actual de ${nombreEmpresa}.

Tienes ${cliente.sellos_actuales} sello(s) acumulado(s)${
        siguientePremio && faltanParaSiguiente !== null
          ? ` y te faltan ${faltanParaSiguiente} para tu próximo premio: ${siguientePremio.nombre}.`
          : "."
      }

¡Te esperamos pronto para seguir sumando sellos! 💖`;

      if (numeroLimpio) {
        const url = `https://wa.me/${numeroLimpio}?text=${encodeURIComponent(
          mensaje
        )}`;
        window.open(url, "_blank");
      } else {
        alert("La imagen se descargó, pero el cliente no tiene teléfono válido.");
      }
    } catch (error) {
      console.error("Error generando tarjeta:", error);
      alert("No se pudo generar la imagen de la tarjeta.");
    } finally {
      setCompartiendo(false);
    }
  }

  if (loading) {
    return <div className="text-[#8b6f6f]">Cargando cliente...</div>;
  }

  if (!cliente) {
    return <div className="text-[#8b6f6f]">No se encontró el cliente.</div>;
  }

  const urlTarjetaPublica = `${window.location.origin}/tarjeta/${cliente.id}`;

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#4a3535]">
            {cliente.nombre_completo}
          </h1>
          <p className="text-[#8b6f6f] mt-1">
            Ficha del cliente y tarjeta de fidelidad
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 space-y-4">
            <div
              ref={tarjetaRef}
              className="rounded-[32px] overflow-hidden shadow-sm border"
              style={{
                borderColor: colorPrimario,
                background: `linear-gradient(145deg, ${colorSecundario} 0%, #ffffff 100%)`,
              }}
            >
              <div
                className="px-8 py-6"
                style={{
                  background: `linear-gradient(135deg, ${colorPrimario} 0%, ${colorSecundario} 100%)`,
                }}
              >
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-sm font-medium text-white/90 tracking-wide">
                      {nombreEmpresa}
                    </p>
                    <h2 className="text-3xl font-bold text-white mt-2">
                      {nombreTarjeta}
                    </h2>
                    <p className="text-white/90 mt-2 text-sm">
                      Cliente: {cliente.nombre_completo}
                    </p>
                  </div>

                  {empresa?.logo_url ? (
                    <div className="h-20 w-20 rounded-3xl bg-white/90 p-3 flex items-center justify-center">
                      <img
                        src={empresa.logo_url}
                        alt="Logo empresa"
                        crossOrigin="anonymous"
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-contain"
                      />
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="p-8">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-sm text-[#8b6f6f]">Ciclo actual</p>
                    <p className="text-xl font-bold text-[#4a3535]">
                      #{cliente.ciclo_tarjeta}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-[#8b6f6f]">Sellos actuales</p>
                    <p className="text-xl font-bold text-[#4a3535]">
                      {cliente.sellos_actuales}/10
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-[#8b6f6f]">Próximo premio</p>
                    <p className="text-base font-semibold text-[#4a3535]">
                      {siguientePremio ? siguientePremio.nombre : "Tarjeta completa"}
                    </p>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-5 gap-4">
                  {Array.from({ length: 10 }).map((_, index) => {
                    const lleno = index < cliente.sellos_actuales;

                    return (
                      <div
                        key={index}
                        className="h-20 rounded-3xl flex items-center justify-center text-3xl border"
                        style={{
                          backgroundColor: lleno ? colorPrimario : "#fff7f7",
                          color: lleno ? "#ffffff" : "#c8a4a8",
                          borderColor: lleno ? colorPrimario : "#ead6d6",
                        }}
                      >
                        {iconoSello}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8 rounded-3xl border border-[#ead6d6] bg-white/70 p-5">
                  {siguientePremio && faltanParaSiguiente !== null ? (
                    <>
                      <p className="text-sm text-[#8b6f6f]">Te faltan</p>
                      <p className="text-2xl font-bold text-[#4a3535]">
                        {faltanParaSiguiente} sello(s)
                      </p>
                      <p className="text-sm text-[#8b6f6f] mt-1">
                        para canjear: {siguientePremio.nombre}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-[#8b6f6f]">¡Excelente!</p>
                      <p className="text-2xl font-bold text-[#4a3535]">
                        Tarjeta completa
                      </p>
                      <p className="text-sm text-[#8b6f6f] mt-1">
                        Ya puedes canjear tu premio final.
                      </p>
                    </>
                  )}
                </div>

                <div className="mt-6 text-xs text-[#8b6f6f] flex items-center justify-between gap-3 flex-wrap">
                  <span>Teléfono: {cliente.telefono || "Sin teléfono"}</span>
                  <span>
                    Cumpleaños: {formatearFecha(cliente.fecha_nacimiento)}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white border border-[#ead6d6] p-6">
              <h2 className="text-xl font-semibold text-[#4a3535]">Resumen</h2>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-2xl bg-[#fff7f7] border border-[#ead6d6] p-4">
                  <p className="text-sm text-[#8b6f6f]">Sellos actuales</p>
                  <p className="text-2xl font-bold text-[#4a3535]">
                    {cliente.sellos_actuales}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#fff7f7] border border-[#ead6d6] p-4">
                  <p className="text-sm text-[#8b6f6f]">Sellos históricos</p>
                  <p className="text-2xl font-bold text-[#4a3535]">
                    {cliente.sellos_historicos}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#fff7f7] border border-[#ead6d6] p-4">
                  <p className="text-sm text-[#8b6f6f]">Siguiente premio</p>
                  <p className="text-base font-semibold text-[#4a3535]">
                    {siguientePremio
                      ? siguientePremio.nombre
                      : "No hay premio siguiente"}
                  </p>
                  {faltanParaSiguiente !== null ? (
                    <p className="text-sm text-[#8b6f6f] mt-1">
                      Faltan {faltanParaSiguiente} sello(s)
                    </p>
                  ) : null}
                </div>
              </div>

              {premiosDisponibles.length > 0 ? (
                <div className="mt-6 rounded-2xl bg-[#f7f1f1] border border-[#ead6d6] p-4">
                  <p className="font-semibold text-[#4a3535]">
                    Premios disponibles para canje
                  </p>
                  <div className="mt-2 space-y-1">
                    {premiosDisponibles.map((premio) => (
                      <p key={premio.id} className="text-sm text-[#8b6f6f]">
                        • {premio.nombre} — {premio.sellos_requeridos} sellos
                      </p>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-2xl bg-[#f7f1f1] border border-[#ead6d6] p-4">
                  <p className="text-sm text-[#8b6f6f]">
                    No hay premios disponibles para este ciclo en este momento.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-[#ead6d6] p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-[#4a3535]">
                Datos del cliente
              </h2>

              {!editando ? (
                <button
                  onClick={iniciarEdicion}
                  className="rounded-xl border border-[#ead6d6] px-4 py-2 text-sm font-semibold text-[#4a3535]"
                >
                  Editar
                </button>
              ) : null}
            </div>

            <div className="mt-4 space-y-3 text-sm">
              {editando ? (
                <>
                  <div>
                    <label className="block text-[#8b6f6f] mb-1">Nombre completo</label>
                    <input
                      value={nombreEdit}
                      onChange={(e) => setNombreEdit(e.target.value)}
                      placeholder="Nombre completo"
                      className="w-full border border-[#ead6d6] rounded-xl px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-[#8b6f6f] mb-1">Teléfono</label>
                    <input
                      value={telefonoEdit}
                      onChange={(e) => setTelefonoEdit(e.target.value)}
                      placeholder="Teléfono"
                      className="w-full border border-[#ead6d6] rounded-xl px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-[#8b6f6f] mb-1">Fecha de nacimiento</label>
                    <input
                      type="date"
                      value={fechaEdit || ""}
                      onChange={(e) => setFechaEdit(e.target.value)}
                      className="w-full border border-[#ead6d6] rounded-xl px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-[#8b6f6f] mb-1">Notas</label>
                    <textarea
                      value={notasEdit}
                      onChange={(e) => setNotasEdit(e.target.value)}
                      placeholder="Notas"
                      rows={4}
                      className="w-full border border-[#ead6d6] rounded-xl px-3 py-2"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      onClick={guardarEdicion}
                      disabled={guardandoEdicion}
                      className="rounded-xl bg-[#d9aeb2] text-white px-4 py-2 text-sm font-semibold disabled:opacity-70"
                    >
                      {guardandoEdicion ? "Guardando..." : "Guardar cambios"}
                    </button>

                    <button
                      onClick={cancelarEdicion}
                      disabled={guardandoEdicion}
                      className="rounded-xl border border-[#ead6d6] px-4 py-2 text-sm font-semibold text-[#4a3535]"
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-[#8b6f6f]">Nombre</p>
                    <p className="font-medium text-[#4a3535]">
                      {cliente.nombre_completo}
                    </p>
                  </div>

                  <div>
                    <p className="text-[#8b6f6f]">Teléfono</p>
                    <p className="font-medium text-[#4a3535]">{cliente.telefono}</p>
                  </div>

                  <div>
                    <p className="text-[#8b6f6f]">Cumpleaños</p>
                    <p className="font-medium text-[#4a3535]">
                      {formatearFecha(cliente.fecha_nacimiento)}
                    </p>
                  </div>

                  <div>
                    <p className="text-[#8b6f6f]">Última visita</p>
                    <p className="font-medium text-[#4a3535]">
                      {formatearFechaLarga(cliente.ultima_visita_at)}
                    </p>
                  </div>

                  <div>
                    <p className="text-[#8b6f6f]">Notas</p>
                    <p className="font-medium text-[#4a3535]">
                      {cliente.notas || "Sin notas"}
                    </p>
                  </div>
                </>
              )}
            </div>

            {!editando ? (
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={handleAgregarSello}
                  disabled={accionLoading}
                  className="rounded-2xl bg-[#d9aeb2] text-white px-5 py-3 font-semibold disabled:opacity-70"
                >
                  {accionLoading ? "Procesando..." : "Agregar sello"}
                </button>

                <button
                  onClick={handleCanjearPremio}
                  disabled={accionLoading}
                  className="rounded-2xl bg-[#4a3535] text-white px-5 py-3 font-semibold disabled:opacity-70"
                >
                  Canjear premio
                </button>

                <button
                  onClick={handleCompartirTarjeta}
                  disabled={compartiendo}
                  className="rounded-2xl bg-green-500 text-white px-5 py-3 font-semibold disabled:opacity-70"
                >
                  {compartiendo ? "Generando..." : "Compartir por WhatsApp"}
                </button>

                <button
                  onClick={() => navigate(`/clientes/${cliente.id}/qr`)}
                  className="rounded-2xl border border-[#ead6d6] px-5 py-3 font-semibold text-[#4a3535]"
                >
                  Ver QR
                </button>

                <button
                  onClick={() => window.open(urlTarjetaPublica, "_blank")}
                  className="rounded-2xl border border-[#ead6d6] px-5 py-3 font-semibold text-[#4a3535]"
                >
                  Ver tarjeta pública
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-[#ead6d6] p-6">
          <h2 className="text-xl font-semibold text-[#4a3535]">Historial</h2>

          <div className="mt-4 space-y-3">
            {movimientos.length === 0 ? (
              <p className="text-sm text-[#8b6f6f]">
                Todavía no hay movimientos para este cliente.
              </p>
            ) : (
              movimientos.map((movimiento) => (
                <div
                  key={movimiento.id}
                  className="rounded-2xl border border-[#ead6d6] p-4"
                >
                  <p className="font-semibold text-[#4a3535]">
                    {movimiento.tipo === "sello"
                      ? "Sello agregado"
                      : movimiento.tipo === "canje"
                      ? "Canje realizado"
                      : "Ajuste manual"}
                  </p>

                  <p className="text-sm text-[#8b6f6f]">
                    Cantidad: {movimiento.cantidad}
                  </p>

                  <p className="text-sm text-[#8b6f6f]">
                    {movimiento.descripcion || "Sin descripción"}
                  </p>

                  <p className="text-xs text-[#b08c8f] mt-1">
                    {formatearFechaLarga(movimiento.created_at)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="fixed -left-[99999px] top-0 pointer-events-none z-[-1]">
        <div
          ref={tarjetaExportRef}
          className="w-[900px] rounded-[32px] overflow-hidden border"
          style={{
            borderColor: colorPrimario,
            background: "#ffffff",
            fontFamily: "Arial, sans-serif",
          }}
        >
          <div
            style={{
              background: colorPrimario,
              padding: "32px",
              color: "#ffffff",
            }}
          >
            <p style={{ fontSize: "16px", opacity: 0.9, margin: 0 }}>
              {nombreEmpresa}
            </p>
            <h2 style={{ fontSize: "40px", fontWeight: 700, margin: "12px 0 0 0" }}>
              {nombreTarjeta}
            </h2>
            <p style={{ fontSize: "18px", opacity: 0.95, margin: "12px 0 0 0" }}>
              Cliente: {cliente.nombre_completo}
            </p>
          </div>

          <div style={{ padding: "32px", background: "#ffffff" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: "16px",
              }}
            >
              {Array.from({ length: 10 }).map((_, index) => {
                const lleno = index < cliente.sellos_actuales;

                return (
                  <div
                    key={index}
                    style={{
                      height: "90px",
                      borderRadius: "24px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "36px",
                      border: `2px solid ${lleno ? colorPrimario : "#ead6d6"}`,
                      backgroundColor: lleno ? colorPrimario : "#fff7f7",
                      color: lleno ? "#ffffff" : "#c8a4a8",
                    }}
                  >
                    {iconoSello}
                  </div>
                );
              })}
            </div>

            <div
              style={{
                marginTop: "28px",
                borderRadius: "24px",
                background: colorSecundario,
                padding: "24px",
              }}
            >
              <p style={{ fontSize: "15px", color: "#8b6f6f", margin: 0 }}>
                Sellos actuales
              </p>
              <p
                style={{
                  fontSize: "42px",
                  fontWeight: 700,
                  color: "#4a3535",
                  margin: "8px 0 0 0",
                }}
              >
                {cliente.sellos_actuales}/10
              </p>

              <p style={{ fontSize: "15px", color: "#8b6f6f", margin: "18px 0 0 0" }}>
                Próximo premio
              </p>
              <p
                style={{
                  fontSize: "24px",
                  fontWeight: 700,
                  color: "#4a3535",
                  margin: "8px 0 0 0",
                }}
              >
                {siguientePremio ? siguientePremio.nombre : "Tarjeta completa"}
              </p>

              <p style={{ fontSize: "16px", color: "#8b6f6f", margin: "12px 0 0 0" }}>
                {faltanParaSiguiente !== null
                  ? `Te faltan ${faltanParaSiguiente} sello(s)`
                  : "Ya puedes canjear tu premio final"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}