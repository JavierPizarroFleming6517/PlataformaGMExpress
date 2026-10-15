import { NextResponse } from 'next/server';
import db from '../../../../lib/db';

export async function GET(request: Request) {

  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const fechaObjetivo = new Date();
    fechaObjetivo.setDate(fechaObjetivo.getDate() + 1);

    const isoString = fechaObjetivo.toISOString().split('T')[0]; 
    const numDiaSemana = fechaObjetivo.getDay();

    if (numDiaSemana === 0 || numDiaSemana === 6) {
      return NextResponse.json({ message: 'Fin de semana. No se auto-asignan pedidos.' });
    }

    const inicioDia = new Date(`${isoString}T00:00:00.000Z`);
    const finDia = new Date(`${isoString}T23:59:59.999Z`);

    const menuDia = await db.menuDiaSeleccion.findFirst({
      where: { fecha_dia: { gte: inicioDia, lte: finDia } },
      include: {
        entradaDetalle: true,
        fondoDetalle: true,
        postreDetalle: true,
      }
    });

    if (!menuDia) {
      return NextResponse.json({ message: 'No hay Menú del Día configurado para mañana.' });
    }

    const trabajadores = await db.usuario.findMany({
      where: { rol: 'TRABAJADOR' },
      include: {
        pedidos: {
          where: { fecha: { gte: inicioDia, lte: finDia } }
        }
      }
    });

    const despistados = trabajadores.filter(t => {
      const yaPidio = t.pedidos.length > 0;
      const diaBloqueado = t.diasBloqueados.includes(numDiaSemana);
      return !yaPidio && !diaBloqueado;
    });

    if (despistados.length === 0) {
      return NextResponse.json({ message: 'Genial. Todos pidieron o tienen el día bloqueado.' });
    }

    const operaciones = despistados.map(t => {
      const datosGuarnicion = menuDia.guarnicionId ? { guarnicionId: menuDia.guarnicionId } : {};

      return db.pedido.create({
        data: {
          fecha: new Date(`${isoString}T12:00:00.000Z`),
          estado: 'PENDIENTE',
          empresaId: t.empresaId!,
          usuarioId: t.id,
          detalles: {
            create: [
              { platoId: menuDia.entradaDetalle.platoId, cantidad: 1 },
              { platoId: menuDia.fondoDetalle.platoId, cantidad: 1, ...datosGuarnicion },
              { platoId: menuDia.postreDetalle.platoId, cantidad: 1 }
            ]
          }
        }
      });
    });

    await db.$transaction(operaciones);

    return NextResponse.json({
      success: true,
      asignados: despistados.length,
      nombres: despistados.map(u => u.nombre),
      mensaje: `Menú del Día asignado exitosamente a ${despistados.length} trabajadores.`
    });

  } catch (error) {
    console.error('[CRON AUTO-ASIGNAR] Error:', error);
    return NextResponse.json({ error: 'Error interno ejecutando el Cron' }, { status: 500 });
  }
}