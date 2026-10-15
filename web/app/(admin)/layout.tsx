import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import db from '@/lib/db'; 
import { Sidebar } from '@/components/admin/sidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/auth/login');
  }

  const usuarioDB = await db.usuario.findUnique({
    where: { id: userId }, 
    select: { rol: true }
  });

  if (usuarioDB?.rol !== 'ADMIN') {
    redirect('/acceso-denegado'); 
  }

  return (
    <>
      <Sidebar />
      <main className="ml-64 min-h-screen bg-slate-50">{children}</main>
    </>
  );
}