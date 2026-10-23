import type { Material } from "./types";

export interface MaterialSpec {
  label: string;
  density: number;
  friction: number;
  health: number;
  points: number;
  fill: string;
  edge: string;
}

export const MATERIALS: Record<Material, MaterialSpec> = {
  hay: {
    label: "Hay bale",
    density: 0.0008,
    friction: 0.9,
    health: 45,
    points: 300,
    fill: "#d9b44a",
    edge: "#9c7a22",
  },
  wood: {
    label: "Cedar plank",
    density: 0.0015,
    friction: 0.7,
    health: 100,
    points: 500,
    fill: "#b07a45",
    edge: "#6e4823",
  },
  pot: {
    label: "Flower pot",
    density: 0.0022,
    friction: 0.6,
    health: 55,
    points: 600,
    fill: "#c06a43",
    edge: "#7a3a1f",
  },
  stone: {
    label: "Garden paver",
    density: 0.003,
    friction: 0.8,
    health: 330,
    points: 800,
    fill: "#a19d90",
    edge: "#5f5c53",
  },
};
