import { useEffect, useRef, useState } from "react";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { SearchFilters } from "./components/SearchFilters";
import { Gallery } from "./components/Gallery";
import { Contact } from "./components/Contact";
import { Footer } from "./components/Footer";
import { AdminPanel } from "./components/AdminPanel";
import { AdminLogin } from "./components/AdminLogin";
import type { Arrangement } from "./components/data/arrangements";
import {
  getProductsFromStorage,
  persistProductsToStorage,
} from "./components/data/productsStore";
import {
  type HeroContent,
  getHeroContentFromStorage,
  getLatestHeroContentFromPersistence,
  persistHeroContentToStorage,
} from "./components/data/heroStore";
import { getAdminSession, setAdminSession } from "./components/data/adminAuth";
import type { ArrangementSearchFilters } from "./components/data/searchFilters";

const isAdminPath = () => {
  if (typeof window === "undefined") return false;

  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  return path.startsWith("/admin") || hash === "#admin" || hash === "#/admin";
};

export default function App() {
  const [products, setProducts] = useState<Arrangement[]>(() =>
    getProductsFromStorage()
  );
  const [heroContent, setHeroContent] = useState<HeroContent>(() =>
    getHeroContentFromStorage()
  );
  const [isAdminView, setIsAdminView] = useState<boolean>(() => isAdminPath());
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean | null>(
    null
  );

  const heroRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);
  const [searchFilters, setSearchFilters] =
    useState<ArrangementSearchFilters | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncPath = () => setIsAdminView(isAdminPath());
    window.addEventListener("hashchange", syncPath);
    window.addEventListener("popstate", syncPath);

    return () => {
      window.removeEventListener("hashchange", syncPath);
      window.removeEventListener("popstate", syncPath);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    void getLatestHeroContentFromPersistence().then((latestContent) => {
      if (!mounted) return;
      setHeroContent(latestContent);
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isAdminView) {
      setIsAdminAuthenticated(false);
      return;
    }

    let mounted = true;
    setIsAdminAuthenticated(null);

    void getAdminSession().then((isAuthenticated) => {
      if (!mounted) return;
      setIsAdminAuthenticated(isAuthenticated);
    });

    return () => {
      mounted = false;
    };
  }, [isAdminView]);

  const scrollToSection = (section: string) => {
    if (section === "hero") {
      heroRef.current?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    if (section === "gallery") {
      galleryRef.current?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    if (section === "contact") {
      contactRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleFilter = (filters: ArrangementSearchFilters) => {
    setSearchFilters(filters);
    galleryRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleProductsChange = (nextProducts: Arrangement[]) => {
    setProducts(nextProducts);
    return persistProductsToStorage(nextProducts);
  };

  const handleHeroContentChange = async (nextHeroContent: HeroContent) => {
    setHeroContent(nextHeroContent);
    return await persistHeroContentToStorage(nextHeroContent);
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminAuthenticated(true);
  };

  const handleAdminLogout = () => {
    void setAdminSession(false);
    setIsAdminAuthenticated(false);
    if (typeof window !== "undefined") {
      window.location.hash = "";
    }
  };

  const exitAdminView = () => {
    if (typeof window !== "undefined") {
      window.location.hash = "";
    }
    setIsAdminView(false);
  };

  if (isAdminView && isAdminAuthenticated === null) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-6"
        style={{ backgroundColor: "#fdf6f0", fontFamily: "'Lato', sans-serif" }}
      >
        Validando sesion administrativa...
      </div>
    );
  }

  if (isAdminView && !isAdminAuthenticated) {
    return <AdminLogin onSuccess={handleAdminLoginSuccess} onBack={exitAdminView} />;
  }

  if (isAdminView) {
    return (
      <AdminPanel
        products={products}
        onProductsChange={handleProductsChange}
        heroContent={heroContent}
        onHeroContentChange={handleHeroContentChange}
        onLogout={handleAdminLogout}
      />
    );
  }

  return (
    <div
      style={{
        fontFamily: "'Lato', sans-serif",
        backgroundColor: "#fdf6f0",
        minHeight: "100vh",
      }}
    >
      <Header onNavClick={scrollToSection} />

      <div ref={heroRef}>
        <Hero
          onScrollToGallery={() => scrollToSection("gallery")}
          content={heroContent}
        />
      </div>

      <SearchFilters onFilter={handleFilter} />

      <div ref={galleryRef}>
        <Gallery searchFilters={searchFilters} products={products} />
      </div>

      <div ref={contactRef}>
        <Contact />
      </div>

      <Footer />
    </div>
  );
}
