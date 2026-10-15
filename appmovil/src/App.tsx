import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut } from '@clerk/clerk-react'; 

import HomePageTrabajador from './pages/homes/HomePageTrabajador';
import HomePageRepresentante from './pages/homes/HomePageRepresentante';
import Login from './pages/auth/Login';
import AccesoDenegado from './pages/auth/AccesoDenegado';
import Historial from './pages/trabajador/Historial'; 
import Trabajadores from './pages/representante/Trabajadores'; 

import LoadingView from './components/LoadingView';
import { usePerfil } from './hooks/usePerfil';

const SelectorDeHome = () => {
  const { rol, empresaId, empresaNombre, cargandoRol } = usePerfil();

  if (cargandoRol) {
    return <LoadingView message="Verificando accesos..." />;
  }

  if (rol === 'ADMIN') {
    return <AccesoDenegado />;
  }

  return rol === 'REPRESENTANTE' 
    ? <HomePageRepresentante empresaId={empresaId} empresaNombre={empresaNombre} /> 
    : <HomePageTrabajador />;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        
        <Route path="/" element={
          <>
            <SignedIn>
              <SelectorDeHome />
            </SignedIn>
            <SignedOut>
              <Login />
            </SignedOut>
          </>
        } />

        
        <Route path="/historial" element={
          <>
            <SignedIn>
              <Historial />
            </SignedIn>
            <SignedOut>
              <Navigate to="/" replace />
            </SignedOut>
          </>
        } />

        
        <Route path="/trabajadores" element={
          <>
            <SignedIn>
              <Trabajadores />
            </SignedIn>
            <SignedOut>
              <Navigate to="/" replace />
            </SignedOut>
          </>
        } />

        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;