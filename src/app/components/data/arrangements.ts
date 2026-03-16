import type { ArrangementBadge } from "./productBadges";
import {
  DEFAULT_BADGE_BACKGROUND_COLOR,
  DEFAULT_BADGE_TEXT_COLOR,
} from "./productBadges";

export interface Arrangement {
  id: number;
  name: string;
  description: string;
  price: number;
  images: string[];
  tags: string[];
  flowers: string[];
  occasion: string[];
  colors: string[];
  date: string;
  featured: boolean;
  badge?: ArrangementBadge;
}

const badge = (text: string, emoji?: string): ArrangementBadge => ({
  text,
  emoji,
  backgroundColor: DEFAULT_BADGE_BACKGROUND_COLOR,
  textColor: DEFAULT_BADGE_TEXT_COLOR,
});

export const arrangements: Arrangement[] = [
  {
    id: 1,
    name: "Bouquet Primavera Rosa",
    description:
      "Un exquisito bouquet de rosas rosadas y peonias, envuelto en papel kraft con cinta satinada dorada. Ideal para celebrar a esa mujer especial en su dia. Incluye flores frescas de temporada y follaje verde premium.",
    price: 120000,
    images: [
      "https://images.unsplash.com/photo-1771134572111-967700a8bb31?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
      "https://images.unsplash.com/photo-1510826079925-c32e6673a0bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    ],
    tags: ["Rosas", "Cumpleanos", "Pastel", "Especial"],
    flowers: ["Rosas", "Peonias"],
    occasion: ["Cumpleanos", "Romance"],
    colors: ["Rosado", "Pastel"],
    date: "Dia de la Mujer",
    featured: true,
    badge: badge("Mas vendido", "⭐"),
  },
  {
    id: 2,
    name: "Elegancia Blanca Premium",
    description:
      "Arreglo de orquideas blancas y rosas marfil sobre base de bamboo verde. Un regalo atemporal que transmite pureza y sofisticacion. Perfecto para condolencias, aniversarios o simplemente para sorprender.",
    price: 185000,
    images: [
      "https://images.unsplash.com/photo-1712629069699-86c8d9a06050?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
      "https://images.unsplash.com/photo-1673277741752-4138d8a01c7b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    ],
    tags: ["Orquideas", "Premium", "Blanco", "Aniversario"],
    flowers: ["Orquideas"],
    occasion: ["Aniversario", "Condolencias"],
    colors: ["Blanco"],
    date: "Aniversario",
    featured: true,
    badge: badge("Premium", "✨"),
  },
  {
    id: 3,
    name: "Sol Radiante",
    description:
      "Alegre bouquet de girasoles frescos con ramas de eucalipto y flores silvestres amarillas. Transmite energia positiva y alegria. Presentado en papel de seda con lazo artesanal.",
    price: 85000,
    images: [
      "https://images.unsplash.com/photo-1760538021426-b7ecf5d2236c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    ],
    tags: ["Girasoles", "Cumpleanos", "Amarillo", "Alegre"],
    flowers: ["Girasoles"],
    occasion: ["Cumpleanos", "Gracias"],
    colors: ["Amarillo"],
    date: "Cumpleanos",
    featured: false,
  },
  {
    id: 4,
    name: "Jardin Pastel Mixto",
    description:
      "Mezcla armoniosa de flores de temporada en tonos pasteles: tulipanes, ranunculos y campanillas. Un arreglo versatil, alegre y delicado que llena cualquier espacio de color y vida.",
    price: 95000,
    images: [
      "https://images.unsplash.com/photo-1618119089596-03403f29a6b4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    ],
    tags: ["Mixtas", "Pastel", "Graduacion", "Primavera"],
    flowers: ["Mixtas", "Tulipanes"],
    occasion: ["Graduacion", "Cumpleanos"],
    colors: ["Pastel", "Multicolor"],
    date: "Dia de la Mujer",
    featured: true,
    badge: badge("Mes de la Mujer", "🌸"),
  },
  {
    id: 5,
    name: "Amor Eterno Rojo",
    description:
      "Clasico e irresistible: 12 rosas rojas largas de tallo en presentacion boutique con papel negro y lazo satinado rojo. El regalo perfecto para expresar amor profundo y pasion.",
    price: 145000,
    images: [
      "https://images.unsplash.com/photo-1771134571934-1bc0b0dd94e3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    ],
    tags: ["Rosas", "Romance", "Rojo", "Amor"],
    flowers: ["Rosas"],
    occasion: ["Romance"],
    colors: ["Rojo"],
    date: "Amor y Amistad",
    featured: false,
  },
  {
    id: 6,
    name: "Serenidad Peonias",
    description:
      "Generoso bouquet de peonias rosadas con gypsophila y hojas de salvia. Elegante y romantico, ideal para regalar en el Dia de la Madre o celebrar a alguien muy especial.",
    price: 160000,
    images: [
      "https://images.unsplash.com/photo-1510826079925-c32e6673a0bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
      "https://images.unsplash.com/photo-1771134572111-967700a8bb31?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    ],
    tags: ["Peonias", "Rosado", "Madre", "Elegante"],
    flowers: ["Peonias"],
    occasion: ["Romance", "Cumpleanos"],
    colors: ["Rosado"],
    date: "Dia de la Madre",
    featured: true,
    badge: badge("Favorito", "💕"),
  },
  {
    id: 7,
    name: "Naturaleza Silvestre",
    description:
      "Composicion artistica con flores silvestres, ramas secas doradas y flores secas preservadas. Un arreglo bohemio y unico que perdura en el tiempo como decoracion.",
    price: 110000,
    images: [
      "https://images.unsplash.com/photo-1758749396186-b7f5ab9c3a72?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    ],
    tags: ["Mixtas", "Decoracion", "Natural", "Rustico"],
    flowers: ["Mixtas"],
    occasion: ["Decoracion", "Gracias"],
    colors: ["Multicolor"],
    date: "Cumpleanos",
    featured: false,
  },
  {
    id: 8,
    name: "Lujo en Blanco Total",
    description:
      "Arreglo de alto impacto visual: rosas blancas, lirios y callas en jarron de cristal premium. Disenado para espacios exclusivos o para regalar con toda la elegancia.",
    price: 250000,
    images: [
      "https://images.unsplash.com/photo-1673277741752-4138d8a01c7b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
      "https://images.unsplash.com/photo-1712629069699-86c8d9a06050?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    ],
    tags: ["Rosas", "Blanco", "Premium", "Lujoso"],
    flowers: ["Rosas", "Orquideas"],
    occasion: ["Aniversario", "Condolencias"],
    colors: ["Blanco"],
    date: "Aniversario",
    featured: false,
    badge: badge("Exclusivo", "💎"),
  },
];
