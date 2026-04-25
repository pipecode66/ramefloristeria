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
  persistHeroContentToStorage,
} from "./components/data/heroStore";
import { getAdminSession, setAdminSession } from "./components/data/adminAuth";
import type { ArrangementSearchFilters } from "./components/data/searchFilters";
import { getSharedStore, syncSharedStorePatch } from "./components/data/sharedStore";

const SHARED_STORE_SYNC_INTERVAL_MS = 120000;

const isAdminPath = () => {
  if (typeof window === "undefined") return false;

  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  return path.startsWith("/admin") || hash === "#admin" || hash === "#/admin";
};

const areProductsEqual = (left: Arrangement, right: Arrangement) =>
  JSON.stringify(left) === JSON.stringify(right);

const areProductListsEqual = (left: Arrangement[], right: Arrangement[]) =>
  left.length === right.length &&
  left.every((product, index) => {
    const rightProduct = right[index];
    return rightProduct ? areProductsEqual(product, rightProduct) : false;
  });

const areHeroContentsEqual = (left: HeroContent, right: HeroContent) =>
  JSON.stringify(left) === JSON.stringify(right);

const buildProductsPatch = (currentProducts: Arrangement[], nextProducts: Arrangement[]) => {
  const currentById = new Map(currentProducts.map((product) => [product.id, product]));
  const nextById = new Map(nextProducts.map((product) => [product.id, product]));

  if (nextProducts.length === currentProducts.length + 1) {
    const created = nextProducts.find((product) => !currentById.has(product.id));
    if (created) {
      return { upsertProduct: created };
    }
  }

  if (nextProducts.length + 1 === currentProducts.length) {
    const removed = currentProducts.find((product) => !nextById.has(product.id));
    if (removed) {
      return { deleteProductId: removed.id };
    }
  }

  if (nextProducts.length === currentProducts.length) {
    const changed = nextProducts.filter((product) => {
      const previous = currentById.get(product.id);
      return previous ? !areProductsEqual(previous, product) : true;
    });

    if (changed.length === 1) {
      return { upsertProduct: changed[0] };
    }
  }

  return { products: nextProducts };
};

const InitialStoreLoading = () => (
  <div
    className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
    style={{
      fontFamily: "'Lato', sans-serif",
      backgroundColor: "#fdf6f0",
      color: "#5a4a3a",
    }}
  >
    <div
      className="w-14 h-14 rounded-full mb-5"
      style={{
        border: "3px solid #e8d5c4",
        borderTopColor: "#4a6741",
        animation: "spin 0.8s linear infinite",
      }}
    />
    <h1
      style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: "28px",
        color: "#3a2e26",
      }}
    >
      Cargando catalogo
    </h1>
    <p style={{ marginTop: "8px", fontSize: "14px", color: "#9e7b5a" }}>
      Estamos trayendo los productos y banners actualizados.
    </p>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

export default function App() {
  const [products, setProducts] = useState<Arrangement[]>(() => getProductsFromStorage());
  const [heroContent, setHeroContent] = useState<HeroContent>(() =>
    getHeroContentFromStorage()
  );
  const [isAdminView, setIsAdminView] = useState<boolean>(() => isAdminPath());
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean | null>(
    null
  );
  const [isInitialStoreSyncing, setIsInitialStoreSyncing] = useState(true);

  const heroRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);
  const productsRef = useRef(products);
  const heroContentRef = useRef(heroContent);
  const [searchFilters, setSearchFilters] =
    useState<ArrangementSearchFilters | null>(null);

  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  useEffect(() => {
    heroContentRef.current = heroContent;
  }, [heroContent]);

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
    if (typeof window === "undefined") return;

    let mounted = true;
    let syncing = false;

    const syncFromSharedStore = async (isInitialSync = false) => {
      if (!mounted || syncing) return;
      syncing = true;

      try {
        const remote = await getSharedStore();
        if (!mounted || !remote.ok) return;

        if (
          remote.products &&
          !areProductListsEqual(productsRef.current, remote.products)
        ) {
          setProducts(remote.products);
          productsRef.current = remote.products;
          await persistProductsToStorage(remote.products);
        }

        if (
          remote.heroContent &&
          !areHeroContentsEqual(heroContentRef.current, remote.heroContent)
        ) {
          setHeroContent(remote.heroContent);
          heroContentRef.current = remote.heroContent;
          await persistHeroContentToStorage(remote.heroContent);
        }
      } finally {
        syncing = false;
        if (isInitialSync && mounted) {
          setIsInitialStoreSyncing(false);
        }
      }
    };

    void syncFromSharedStore(true);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && !isAdminPath()) {
        void syncFromSharedStore();
      }
    };

    const handleWindowFocus = () => {
      if (!isAdminPath()) {
        void syncFromSharedStore();
      }
    };

    const intervalId = window.setInterval(() => {
      if (!isAdminPath()) {
        void syncFromSharedStore();
      }
    }, SHARED_STORE_SYNC_INTERVAL_MS);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleWindowFocus);
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

  const handleProductsChange = async (nextProducts: Arrangement[]) => {
    const previousProducts = productsRef.current;
    setProducts(nextProducts);
    productsRef.current = nextProducts;

    const localResult = await persistProductsToStorage(nextProducts);
    if (!localResult.ok) {
      setProducts(previousProducts);
      productsRef.current = previousProducts;
      await persistProductsToStorage(previousProducts);
      return localResult;
    }

    const sharedResult = await syncSharedStorePatch(
      buildProductsPatch(previousProducts, nextProducts)
    );
    if (!sharedResult.ok) {
      setProducts(previousProducts);
      productsRef.current = previousProducts;
      await persistProductsToStorage(previousProducts);
      return {
        ok: false,
        error:
          sharedResult.error ??
          "No se pudo sincronizar el catalogo para otros dispositivos.",
      };
    }

    return { ok: true };
  };

  const handleHeroContentChange = async (nextHeroContent: HeroContent) => {
    const previousHeroContent = heroContentRef.current;
    setHeroContent(nextHeroContent);
    heroContentRef.current = nextHeroContent;

    const localResult = await persistHeroContentToStorage(nextHeroContent);
    if (!localResult.ok) {
      setHeroContent(previousHeroContent);
      heroContentRef.current = previousHeroContent;
      await persistHeroContentToStorage(previousHeroContent);
      return localResult;
    }

    const sharedResult = await syncSharedStorePatch({ heroContent: nextHeroContent });
    if (!sharedResult.ok) {
      setHeroContent(previousHeroContent);
      heroContentRef.current = previousHeroContent;
      await persistHeroContentToStorage(previousHeroContent);
      return {
        ok: false,
        error:
          sharedResult.error ??
          "No se pudo sincronizar el banner para otros dispositivos.",
      };
    }

    return { ok: true };
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

  if (isInitialStoreSyncing) {
    return <InitialStoreLoading />;
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
        <Hero content={heroContent} />
      </div>

      <SearchFilters onFilter={handleFilter} />

      <div ref={galleryRef}>
        <Gallery
          searchFilters={searchFilters}
          products={products}
          featuredLabel={(heroContent.featuredTabLabel ?? "").trim() || "Arreglos del mes"}
        />
      </div>

      <div ref={contactRef}>
        <Contact />
      </div>

      <Footer />
    </div>
  );
}
