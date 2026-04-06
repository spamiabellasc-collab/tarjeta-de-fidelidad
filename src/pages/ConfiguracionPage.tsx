import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { useAuth } from "../features/auth/AuthContext";
import {
  actualizarEmpresa,
  obtenerEmpresaPorId,
  subirLogoEmpresa,
  obtenerConfiguracionEmpresa,
  guardarConfiguracionEmpresa,
  reemplazarVariablesTemplate,
} from "../features/configuracion/configuracionService";

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
  slug: string | null;
};

type ConfigEmpresa = {
  whatsapp_cumple_template: string | null;
  whatsapp_premio_template: string | null;
  whatsapp_inactivo_template: string | null;
};

const iconosDisponibles = ["✿", "★", "❤", "◆", "●", "☀", "♛", "❀"];

const defaultCumple = `¡Hola {{nombre}}! 🎉

Todo el equipo de {{empresa}} te desea un feliz cumpleaños.

Te esperamos para consentirte en tu día especial 💖`;

const defaultPremio = `¡Hola {{nombre}}! ✨

Te escribimos de {{empresa}} para contarte que estás muy cerca de tu próximo premio.

Solo te faltan {{faltan}} sello(s) para canjear: {{premio}}.

¡Te esperamos pronto para seguir sumando! 💖`;

const defaultInactivo = `¡Hola {{nombre}}! 😊

Te saludamos de {{empresa}}. Hace {{dias}} días que no nos visitas y queremos invitarte a volver.

Será un gusto atenderte nuevamente 💖`;

function limpiarSlug(valor: string) {
  return valor
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function ConfiguracionPage() {
  const { profile } = useAuth();

  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [nombre, setNombre] = useState("");
  const [nombreComercial, setNombreComercial] = useState("");
  const [nombreTarjeta, setNombreTarjeta] = useState("");
  const [telefono, setTelefono] = useState("");
  const [slug, setSlug] = useState("");
  const [colorPrimario, setColorPrimario] = useState("#D9AEB2");
  const [colorSecundario, setColorSecundario] = useState("#F4E7E7");
  const [logoUrl, setLogoUrl] = useState("");
  const [iconoSello, setIconoSello] = useState("✿");

  const [templateCumple, setTemplateCumple] = useState(defaultCumple);
  const [templatePremio, setTemplatePremio] = useState(defaultPremio);
  const [templateInactivo, setTemplateInactivo] = useState(defaultInactivo);

  const [loading, setLoading] = useState(false);
  const [subiendoLogo, setSubiendoLogo] = useState(false);
  const [cargandoEmpresa, setCargandoEmpresa] = useState(true);
  const [qrUrl, setQrUrl] = useState("");

  async function cargarEmpresa() {
    if (!profile?.empresa_id) {
      setCargandoEmpresa(false);
      return;
    }

    setCargandoEmpresa(true);

    const [
      { data: empresaData, error: empresaError },
      { data: configData, error: configError },
    ] = await Promise.all([
      obtenerEmpresaPorId(profile.empresa_id),
      obtenerConfiguracionEmpresa(profile.empresa_id),
    ]);

    if (empresaError) {
      console.error("Error cargando empresa:", empresaError);
      alert("No se pudo cargar la empresa.");
      setCargandoEmpresa(false);
      return;
    }

    if (configError) {
      console.error("Error cargando configuración empresa:", configError);
    }

    const empresaFinal = (empresaData as Empresa) || null;
    const configFinal = (configData as ConfigEmpresa) || null;

    setEmpresa(empresaFinal);

    if (empresaFinal) {
      setNombre(empresaFinal.nombre || "");
      setNombreComercial(empresaFinal.nombre_comercial || "");
      setNombreTarjeta(empresaFinal.nombre_tarjeta || "Tarjeta de fidelidad");
      setTelefono(empresaFinal.telefono || "");
      setSlug(empresaFinal.slug || "");
      setColorPrimario(empresaFinal.color_primario || "#D9AEB2");
      setColorSecundario(empresaFinal.color_secundario || "#F4E7E7");
      setLogoUrl(empresaFinal.logo_url || "");
      setIconoSello(empresaFinal.icono_sello || "✿");
    }

    setTemplateCumple(
      configFinal?.whatsapp_cumple_template || defaultCumple
    );
    setTemplatePremio(
      configFinal?.whatsapp_premio_template || defaultPremio
    );
    setTemplateInactivo(
      configFinal?.whatsapp_inactivo_template || defaultInactivo
    );

    setCargandoEmpresa(false);
  }

  useEffect(() => {
    void cargarEmpresa();
  }, [profile?.empresa_id]);

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!empresa?.id) {
      alert("No se encontró la empresa");
      return;
    }

    setSubiendoLogo(true);

    const { data, error } = await subirLogoEmpresa(empresa.id, file);

    setSubiendoLogo(false);

    if (error) {
      alert("Error al subir logo: " + error.message);
      return;
    }

    const urlPublica = data?.publicUrl || "";
    setLogoUrl(urlPublica);
  }

  async function handleGuardar() {
    if (!empresa?.id || !profile?.empresa_id) {
      alert("No se encontró la empresa");
      return;
    }

    if (!nombre.trim()) {
      alert("El nombre es obligatorio");
      return;
    }

    const slugLimpio = limpiarSlug(slug);

    if (!slugLimpio) {
      alert("Debes ingresar un slug válido para el link de registro");
      return;
    }

    setLoading(true);

    const [{ error: errorEmpresa }, { error: errorConfig }] = await Promise.all([
      actualizarEmpresa(empresa.id, {
        nombre,
        nombre_comercial: nombreComercial || null,
        nombre_tarjeta: nombreTarjeta || null,
        telefono: telefono || null,
        slug: slugLimpio,
        color_primario: colorPrimario || null,
        color_secundario: colorSecundario || null,
        logo_url: logoUrl || null,
        icono_sello: iconoSello || "✿",
      }),
      guardarConfiguracionEmpresa(profile.empresa_id, {
        whatsapp_cumple_template: templateCumple || defaultCumple,
        whatsapp_premio_template: templatePremio || defaultPremio,
        whatsapp_inactivo_template: templateInactivo || defaultInactivo,
      }),
    ]);

    setLoading(false);

    if (errorEmpresa) {
      alert("Error al guardar datos de empresa: " + errorEmpresa.message);
      return;
    }

    if (errorConfig) {
      alert("Error al guardar plantillas: " + errorConfig.message);
      return;
    }

    alert("Configuración guardada correctamente");
    setSlug(slugLimpio);
    await cargarEmpresa();
  }

  const previewCumple = reemplazarVariablesTemplate(templateCumple, {
    nombre: "María",
    empresa: nombreComercial || nombre || "Tu empresa",
  });

  const previewPremio = reemplazarVariablesTemplate(templatePremio, {
    nombre: "María",
    empresa: nombreComercial || nombre || "Tu empresa",
    faltan: 1,
    premio: "20% de descuento",
  });

  const previewInactivo = reemplazarVariablesTemplate(templateInactivo, {
    nombre: "María",
    empresa: nombreComercial || nombre || "Tu empresa",
    dias: 18,
  });

  const slugPreview = useMemo(() => limpiarSlug(slug), [slug]);

  const linkRegistro = slugPreview
    ? `${window.location.origin}/registro/${slugPreview}`
    : "";

  async function generarQR() {
    if (!linkRegistro) {
      alert("Primero debes ingresar un slug válido.");
      return;
    }

    try {
      const url = await QRCode.toDataURL(linkRegistro);
      setQrUrl(url);
    } catch (error) {
      console.error("Error generando QR:", error);
      alert("No se pudo generar el QR");
    }
  }

  if (cargandoEmpresa) {
    return <div className="text-[#8b6f6f]">Cargando empresa...</div>;
  }

  if (!empresa) {
    return (
      <div className="rounded-3xl bg-white border border-[#ead6d6] p-6">
        <h1 className="text-2xl font-bold text-[#4a3535]">Configuración</h1>
        <p className="text-[#8b6f6f] mt-2">No se encontró la empresa.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#4a3535]">Configuración</h1>
        <p className="text-[#8b6f6f] mt-1">
          Personaliza los datos visuales, logo, sellos, link de registro y
          mensajes de WhatsApp
        </p>
      </div>

      <div className="rounded-3xl bg-white border border-[#ead6d6] p-6 shadow-sm space-y-5">
        <h2 className="text-xl font-semibold text-[#4a3535]">
          Datos de la empresa
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            placeholder="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="rounded-2xl border border-[#e8d5d5] px-4 py-3 outline-none"
          />

          <input
            placeholder="Nombre comercial"
            value={nombreComercial}
            onChange={(e) => setNombreComercial(e.target.value)}
            className="rounded-2xl border border-[#e8d5d5] px-4 py-3 outline-none"
          />

          <input
            placeholder="Nombre de la tarjeta"
            value={nombreTarjeta}
            onChange={(e) => setNombreTarjeta(e.target.value)}
            className="rounded-2xl border border-[#e8d5d5] px-4 py-3 outline-none"
          />

          <input
            placeholder="Teléfono"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            className="rounded-2xl border border-[#e8d5d5] px-4 py-3 outline-none"
          />

          <div className="md:col-span-2 rounded-2xl border border-[#e8d5d5] px-4 py-4">
            <label className="block text-sm font-medium text-[#4a3535] mb-2">
              Link de registro (slug)
            </label>

            <input
              placeholder="Ejemplo: miabella"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full rounded-2xl border border-[#e8d5d5] px-4 py-3 outline-none"
            />

            <p className="text-xs text-[#8b6f6f] mt-2">
              Usa solo letras, números y guiones. Ejemplo:
              {" "}
              <span className="font-semibold">miabella</span>
            </p>

            <div className="mt-3 rounded-2xl border border-[#ead6d6] bg-[#fff7f7] px-4 py-3 text-sm text-[#4a3535] break-all">
              {linkRegistro || "Ingresa un slug para generar el link"}
            </div>
          </div>

          <div className="rounded-2xl border border-[#e8d5d5] px-4 py-3">
            <label className="block text-sm text-[#8b6f6f] mb-2">
              Color primario
            </label>
            <input
              type="color"
              value={colorPrimario}
              onChange={(e) => setColorPrimario(e.target.value)}
              className="w-16 h-10 border-0 bg-transparent"
            />
          </div>

          <div className="rounded-2xl border border-[#e8d5d5] px-4 py-3">
            <label className="block text-sm text-[#8b6f6f] mb-2">
              Color secundario
            </label>
            <input
              type="color"
              value={colorSecundario}
              onChange={(e) => setColorSecundario(e.target.value)}
              className="w-16 h-10 border-0 bg-transparent"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-[#e8d5d5] px-4 py-4">
          <label className="block text-sm text-[#8b6f6f] mb-3">
            Logo de la empresa
          </label>

          <input type="file" accept="image/*" onChange={handleLogoChange} />

          <p className="text-xs text-[#8b6f6f] mt-2">
            {subiendoLogo ? "Subiendo logo..." : "Puedes subir PNG, JPG o WEBP"}
          </p>

          {logoUrl ? (
            <div className="mt-4">
              <img
                src={logoUrl}
                alt="Logo empresa"
                className="h-20 w-20 object-contain rounded-2xl border border-[#ead6d6] bg-white p-2"
              />
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-[#e8d5d5] px-4 py-4">
          <label className="block text-sm text-[#8b6f6f] mb-3">
            Ícono de los sellos
          </label>

          <div className="flex flex-wrap gap-3">
            {iconosDisponibles.map((icono) => (
              <button
                key={icono}
                type="button"
                onClick={() => setIconoSello(icono)}
                className={`h-14 w-14 rounded-2xl border text-2xl flex items-center justify-center ${
                  iconoSello === icono
                    ? "border-[#d9aeb2] bg-[#f7e8e8]"
                    : "border-[#ead6d6] bg-white"
                }`}
              >
                {icono}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-white border border-[#ead6d6] p-6 shadow-sm space-y-4">
        <h2 className="text-xl font-semibold text-[#4a3535]">
          Registro automático de clientes
        </h2>

        <p className="text-sm text-[#8b6f6f]">
          Comparte este link para que tus clientes se registren solos y obtengan
          su tarjeta digital.
        </p>

        <div className="rounded-2xl border border-[#ead6d6] px-4 py-3 text-sm text-[#4a3535] break-all bg-[#fff7f7]">
          {linkRegistro || "No disponible"}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => {
              if (!linkRegistro) return;
              navigator.clipboard.writeText(linkRegistro);
              alert("Link copiado");
            }}
            className="rounded-2xl bg-[#d9aeb2] px-4 py-2 text-sm font-semibold text-white"
          >
            Copiar link
          </button>

          <button
            onClick={() => {
              if (!linkRegistro) return;
              window.open(linkRegistro, "_blank");
            }}
            className="rounded-2xl border border-[#ead6d6] px-4 py-2 text-sm font-semibold text-[#4a3535]"
          >
            Abrir página
          </button>
        </div>
      </div>

      <div className="rounded-3xl bg-white border border-[#ead6d6] p-6 shadow-sm space-y-4">
        <h2 className="text-xl font-semibold text-[#4a3535]">
          QR para clientes
        </h2>

        <p className="text-sm text-[#8b6f6f]">
          Genera este QR para imprimirlo y colocarlo en tu negocio. Así los
          clientes pueden registrarse solos.
        </p>

        <div>
          <button
            onClick={generarQR}
            className="rounded-2xl bg-[#4a3535] px-4 py-2 text-sm font-semibold text-white"
          >
            Generar QR
          </button>
        </div>

        {qrUrl ? (
          <div className="flex justify-center">
            <img
              src={qrUrl}
              alt="QR Registro"
              className="w-52 h-52 rounded-2xl border border-[#ead6d6] bg-white p-3"
            />
          </div>
        ) : null}
      </div>

      <div className="rounded-3xl bg-white border border-[#ead6d6] p-6 shadow-sm space-y-5">
        <h2 className="text-xl font-semibold text-[#4a3535]">
          Plantillas de WhatsApp
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#4a3535] mb-2">
              Cumpleaños
            </label>
            <textarea
              value={templateCumple}
              onChange={(e) => setTemplateCumple(e.target.value)}
              rows={6}
              className="w-full rounded-2xl border border-[#e8d5d5] px-4 py-3 outline-none"
            />
            <p className="text-xs text-[#8b6f6f] mt-2">
              Variables: {"{{nombre}}"}, {"{{empresa}}"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4a3535] mb-2">
              Premio próximo
            </label>
            <textarea
              value={templatePremio}
              onChange={(e) => setTemplatePremio(e.target.value)}
              rows={7}
              className="w-full rounded-2xl border border-[#e8d5d5] px-4 py-3 outline-none"
            />
            <p className="text-xs text-[#8b6f6f] mt-2">
              Variables: {"{{nombre}}"}, {"{{empresa}}"}, {"{{faltan}}"},{" "}
              {"{{premio}}"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4a3535] mb-2">
              Cliente inactivo
            </label>
            <textarea
              value={templateInactivo}
              onChange={(e) => setTemplateInactivo(e.target.value)}
              rows={6}
              className="w-full rounded-2xl border border-[#e8d5d5] px-4 py-3 outline-none"
            />
            <p className="text-xs text-[#8b6f6f] mt-2">
              Variables: {"{{nombre}}"}, {"{{empresa}}"}, {"{{dias}}"}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-white border border-[#ead6d6] p-6 shadow-sm space-y-5">
        <h2 className="text-xl font-semibold text-[#4a3535]">
          Vista previa de mensajes
        </h2>

        <div className="space-y-4">
          <div className="rounded-2xl border border-[#ead6d6] p-4 bg-[#fffaf9]">
            <p className="text-sm font-semibold text-[#4a3535] mb-2">
              Vista previa cumpleaños
            </p>
            <pre className="whitespace-pre-wrap text-sm text-[#8b6f6f] font-sans">
              {previewCumple}
            </pre>
          </div>

          <div className="rounded-2xl border border-[#ead6d6] p-4 bg-[#fffaf9]">
            <p className="text-sm font-semibold text-[#4a3535] mb-2">
              Vista previa premio próximo
            </p>
            <pre className="whitespace-pre-wrap text-sm text-[#8b6f6f] font-sans">
              {previewPremio}
            </pre>
          </div>

          <div className="rounded-2xl border border-[#ead6d6] p-4 bg-[#fffaf9]">
            <p className="text-sm font-semibold text-[#4a3535] mb-2">
              Vista previa inactivo
            </p>
            <pre className="whitespace-pre-wrap text-sm text-[#8b6f6f] font-sans">
              {previewInactivo}
            </pre>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleGuardar}
            className="rounded-2xl bg-[#d9aeb2] text-white px-6 py-3 font-semibold hover:opacity-90 transition"
          >
            {loading ? "Guardando..." : "Guardar configuración"}
          </button>
        </div>
      </div>
    </div>
  );
}