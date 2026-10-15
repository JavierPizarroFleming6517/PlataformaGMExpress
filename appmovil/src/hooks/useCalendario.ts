import { useState, useMemo } from 'react';


export interface DiaSemana {
  letra:        string;
  numero:       number;
  iso:          string;
  esHoy:        boolean;
  esSeleccionado: boolean;
  bloqueado:    boolean;
}


function getIndiceHoy(): number {
  const d = new Date().getDay();
  if (d >= 1 && d <= 5) return d - 1;
  return 0;
}


export const useCalendario = () => {
  const [semanaOffset, setSemanaOffset] = useState(0);

  const [diaSeleccionadoIdx, setDiaSeleccionadoIdx] = useState<number>(getIndiceHoy);

  const { fechaTexto, diasSemanaArray } = useMemo(() => {
    const hoy = new Date();
    const hoySoloFecha = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

    const txt = new Intl.DateTimeFormat('es-CL', {
      weekday: 'long',
      day:     'numeric',
      month:   'long',
      timeZone: 'America/Santiago',
    }).format(hoy);

    const lunesReferencia = new Date(hoySoloFecha);
    const diaActual = lunesReferencia.getDay() === 0 ? 7 : lunesReferencia.getDay();
    lunesReferencia.setDate(
      lunesReferencia.getDate() - (diaActual - 1) + semanaOffset * 7
    );

    const letras = ['L', 'M', 'M', 'J', 'V'];

    const array: DiaSemana[] = letras.map((letra, index) => {
      const fechaDia = new Date(lunesReferencia);
      fechaDia.setDate(lunesReferencia.getDate() + index);

      const year  = fechaDia.getFullYear();
      const month = String(fechaDia.getMonth() + 1).padStart(2, '0');
      const day   = String(fechaDia.getDate()).padStart(2, '0');
      const iso   = `${year}-${month}-${day}`;

      return {
        letra,
        numero:         fechaDia.getDate(),
        iso,
        esHoy:          fechaDia.getTime() === hoySoloFecha.getTime(),
        esSeleccionado: index === diaSeleccionadoIdx,
        bloqueado:       semanaOffset < 0,
      };
    });

    return { fechaTexto: txt, diasSemanaArray: array };
  }, [semanaOffset, diaSeleccionadoIdx]);

  const fechaSeleccionadaISO: string = diasSemanaArray[diaSeleccionadoIdx]?.iso ?? '';

  const cambiarSemana = (delta: number) => {
    setSemanaOffset(prev => prev + delta);
    setDiaSeleccionadoIdx(0);
  };

  const getSemanaTexto = (): string => {
    if (semanaOffset === 0)  return 'Esta semana';
    if (semanaOffset === 1)  return 'Próxima semana';
    if (semanaOffset > 1)    return `En ${semanaOffset} semanas`;
    if (semanaOffset === -1) return 'Semana pasada';
    return `Hace ${Math.abs(semanaOffset)} semanas`;
  };

  return {
    semanaOffset,
    setSemanaOffset: cambiarSemana,
    diaSeleccionadoIdx,
    setDiaSeleccionadoIdx,
    fechaSeleccionadaISO,
    fechaTexto,
    diasSemanaArray,
    getSemanaTexto,
  };
};