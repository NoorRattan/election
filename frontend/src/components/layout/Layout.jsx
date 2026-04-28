import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 font-sans">
      <Navbar />
      <main
        id="main-content"
        aria-label="Main content"
        className="flex-1 w-full"
      >
        {children || <Outlet />}
      </main>
      <Footer />
    </div>
  );
}
