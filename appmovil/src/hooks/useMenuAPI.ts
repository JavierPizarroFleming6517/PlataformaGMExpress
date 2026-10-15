import { useState, useEffect } from "react";
import { API_BASE_URL } from "../constants/api";


export interface Guarnicion {
  id:     number;
  nombre: string;
}

export interface Plato {
  id:          number;
  nombre:      string;
  url_imagen:  string | null;
  categoria:   "ENTRADA" | "FONDO" | "POSTRE" | "JUGO" | "BEBIDA" | "AGUA_SABORIZADA";
  tipo:        "NORMAL" | "VEGANO" | "VEGETARIANO" | "HIPOCALORICO" | "PLATO_UNICO";
  calorias?:   number | null;
  proteinas?:  number | null;
  carbohidratos?: number | null;
  grasas?:     number | null;
  guarniciones: Guarnicion[];
  menuDetalleId?: number;
}

export interface MenuDia {
  entradas: Plato[];
  fondos:   Plato[];
  postres:  Plato[];
  menuDia:  {
    entrada?: Plato | null;
    fondo?: Plato | null;
    postre?: Plato | null;
    guarnicion?: Guarnicion | null;
    entradasSeleccionadas?: Plato[];
    entradaDisplay?: string | null;
    bebida?: Plato | null;
  } | null;
}

const MENU_VACIO: MenuDia = { entradas: [], fondos: [], postres: [], menuDia: null };


export const useMenuAPI = (fecha?: string, usuarioId?: string) => {
  const [menuHoy, setMenuHoy] = useState<MenuDia>(MENU_VACIO);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let cancelado = false;

    const cargarMenu = async () => {
      setCargando(true);
      try {
        const params = new URLSearchParams();
        if (fecha) params.set("fecha", fecha);
        if (usuarioId) params.set("usuarioId", usuarioId);
        const query = params.toString();
        const url = `${API_BASE_URL}/api/trabajador/menu-semanal${query ? `?${query}` : ""}`;

        const respuesta = await fetch(url);

        if (!respuesta.ok) {
          console.error("[useMenuAPI] Error HTTP:", respuesta.status);
          if (!cancelado) setMenuHoy(MENU_VACIO);
          return;
        }

        const datos: MenuDia = await respuesta.json();
        if (!cancelado) setMenuHoy(datos);
      } catch (error) {
        console.error("[useMenuAPI] Error de red:", error);
        if (!cancelado) setMenuHoy(MENU_VACIO);
      } finally {
        if (!cancelado) setCargando(false);
      }
    };

    cargarMenu();

    return () => {
      cancelado = true;
    };
  }, [fecha, usuarioId]);

  return { menuHoy, cargando };
};
