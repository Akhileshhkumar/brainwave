import { useState } from "react";
import ButtonGradient from "./assets/svg/ButtonGradient";
import Benefits from "./components/Benefits";
import Collaboration from "./components/Collaboration";
import Footer from "./components/Footer";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Pricing from "./components/Pricing";
import Roadmap from "./components/Roadmap";
import Services from "./components/Services";
import ScannerPopup from "./components/ScannerPopup"; // ✅ Scanner popup
import { FaCamera } from "react-icons/fa"; // ✅ Camera icon

const App = () => {
  const [showScanner, setShowScanner] = useState(false);

  return (
    <>
      <div className="pt-[4.75rem] lg:pt-[5.25rem] overflow-hidden relative">
        <Header />
        <Hero />
        <Benefits />
        <Collaboration />
        <Services />
        <Pricing />
        <Roadmap />
        <Footer />

        {/* ✅ Scanner Icon (Bottom Right) */}
        <button
          onClick={() => setShowScanner(true)}
          className="fixed bottom-6 right-6 p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition z-50"
        >
          <FaCamera size={22} />
        </button>

        {/* ✅ Scanner Popup Modal */}
        {showScanner && <ScannerPopup onClose={() => setShowScanner(false)} />}
      </div>

      <ButtonGradient />
    </>
  );
};

export default App;
