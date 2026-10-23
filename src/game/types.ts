export interface Vec {
  x: number;
  y: number;
}

export type Material = "hay" | "wood" | "pot" | "stone";

/** A rectangular garden object. Positions are the block's centre in world units. */
export interface BlockDef {
  material: Material;
  x: number;
  y: number;
  w: number;
  h: number;
  angle?: number;
}

export type RabbitSize = "kit" | "buck";

export interface RabbitDef {
  x: number;
  y: number;
  size: RabbitSize;
}

export interface LevelDef {
  id: number;
  name: string;
  /** Shown before the first pounce on early levels. */
  hint?: string;
  /** How many pounces Biscuit gets. */
  dogs: number;
  /** Pounces needed for three bones. */
  par: number;
  blocks: BlockDef[];
  rabbits: RabbitDef[];
}
