import { AnimatePresence } from 'framer-motion';
import { Route, Routes, useLocation } from 'react-router-dom';
import AuthGate from './components/AuthGate';
import Backdrop from './components/Backdrop';
import { MenuProvider } from './components/Menu';
import { ToastProvider } from './components/Toast';
import TopBar from './components/TopBar';
import PatientCard from './pages/PatientCard';
import PatientForm from './pages/PatientForm';
import Patients from './pages/Patients';
import PatientView from './pages/PatientView';
import Session from './pages/Session';
import NotFound from './pages/NotFound';

export default function App() {
  const location = useLocation();
  const isPatientScreen = location.pathname.startsWith('/p/');
  return (
    <ToastProvider>
      <MenuProvider>
        <Backdrop />
        {isPatientScreen ? (
          <>
            <TopBar minimal />
            <Routes>
              <Route path="/p/:token" element={<PatientView />} />
            </Routes>
          </>
        ) : (
          <AuthGate>
            <TopBar />
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<Patients />} />
                <Route path="/patients/new" element={<PatientForm />} />
                <Route path="/patients/:id" element={<PatientCard />} />
                <Route path="/patients/:id/edit" element={<PatientForm />} />
                <Route path="/patients/:id/sessions/:sid" element={<Session />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AnimatePresence>
          </AuthGate>
        )}
      </MenuProvider>
    </ToastProvider>
  );
}
