import Matter from "matter-js";
import {
  ANCHOR,
  BARK_RADIUS,
  BARK_SCARE_RADIUS,
  DOG_RADIUS,
  GRAVITY_PER_STEP,
  GROUND_Y,
  MAX_LAUNCH_SPEED,
  MAX_PULL,
  MAX_PULL_DOWN,
  POINTS,
  RABBIT_HEALTH,
  RABBIT_RADIUS,
  STEP_MS,
  WORLD_W,
} from "./constants";
import { MATERIALS } from "./materials";
import { starsFor, type Stars } from "./scoring";
import type { BlockDef, LevelDef, RabbitDef, Vec } from "./types";

const { Bodies, Body, Composite, Engine, Events, Sleeping } = Matter;

/** Impacts slower than this (px/step along the contact normal) do no damage. */
const MIN_IMPACT = 1.6;
const DAMAGE_SCALE = 9;
/** The dog is the weapon: its hits count for more than a falling plank's. */
const DOG_HIT_BONUS = 1.6;
/** Let structures settle before anything can be hurt. */
const GRACE_STEPS = 45;
const MAX_FLIGHT_STEPS = 60 * 9;
const REST_SPEED = 0.25;
const REST_STEPS = 40;
const WIN_DELAY_STEPS = 70;

export type Phase = "aiming" | "flying" | "won" | "lost";

export interface BlockState {
  id: number;
  def: BlockDef;
  body: Matter.Body;
  health: number;
  maxHealth: number;
}

export interface RabbitState {
  id: number;
  def: RabbitDef;
  body: Matter.Body;
  health: number;
  /** Steps since this rabbit last took a hit, for the flinch animation. */
  flinch: number;
}

export type Effect =
  | { kind: "bark"; x: number; y: number; age: number }
  | { kind: "flee"; x: number; y: number; size: RabbitDef["size"]; age: number }
  | { kind: "debris"; x: number; y: number; vx: number; vy: number; color: string; size: number; age: number }
  | { kind: "points"; x: number; y: number; value: number; age: number };

export interface SessionEvents {
  launch?: () => void;
  bark?: () => void;
  rabbitScared?: () => void;
  blockBroken?: (material: BlockDef["material"]) => void;
  thud?: (strength: number) => void;
  finished?: (result: SessionResult) => void;
}

export interface SessionResult {
  won: boolean;
  score: number;
  dogsUsed: number;
  stars: Stars;
}

type Tag =
  | { type: "block"; state: BlockState }
  | { type: "rabbit"; state: RabbitState }
  | { type: "dog" }
  | { type: "ground" };

/** Limits a pull to the leash length, and keeps Biscuit from being dragged through the deck. */
export function clampPull(pull: Vec): Vec {
  const len = Math.hypot(pull.x, pull.y);
  const k = len > MAX_PULL ? MAX_PULL / len : 1;
  return { x: pull.x * k, y: Math.min(pull.y * k, MAX_PULL_DOWN) };
}

/** Launch velocity for a given pull. Pulling back-and-down throws forward-and-up. */
export function launchVelocity(pull: Vec): Vec {
  const p = clampPull(pull);
  const k = MAX_LAUNCH_SPEED / MAX_PULL;
  return { x: -p.x * k, y: -p.y * k };
}

/** Predicted flight path, matching matter-js integration for a body with no air friction. */
export function predictPath(pull: Vec, steps = 60, every = 3): Vec[] {
  const p = clampPull(pull);
  const v = launchVelocity(p);
  let x = ANCHOR.x + p.x;
  let y = ANCHOR.y + p.y;
  let vx = v.x;
  let vy = v.y;
  const out: Vec[] = [];
  for (let i = 1; i <= steps; i++) {
    vy += GRAVITY_PER_STEP;
    x += vx;
    y += vy;
    if (y > GROUND_Y) break;
    if (i % every === 0) out.push({ x, y });
  }
  return out;
}

export class GameSession {
  readonly level: LevelDef;
  readonly engine: Matter.Engine;
  blocks: BlockState[] = [];
  rabbits: RabbitState[] = [];
  effects: Effect[] = [];
  dog: Matter.Body | null = null;
  phase: Phase = "aiming";
  pull: Vec = { x: 0, y: 0 };
  score = 0;
  dogsLeft: number;
  dogsUsed = 0;
  barkUsed = false;
  steps = 0;

  private tags = new Map<number, Tag>();
  private flightSteps = 0;
  private restSteps = 0;
  private winCountdown = -1;
  private events: SessionEvents;
  private nextId = 1;

  constructor(level: LevelDef, events: SessionEvents = {}) {
    this.level = level;
    this.events = events;
    this.dogsLeft = level.dogs;
    this.engine = Engine.create({
      enableSleeping: true,
      positionIterations: 10,
      velocityIterations: 8,
    });

    const ground = Bodies.rectangle(WORLD_W / 2, GROUND_Y + 100, WORLD_W * 3, 200, {
      isStatic: true,
      friction: 1,
      label: "ground",
    });
    const backWall = Bodies.rectangle(-60, 0, 100, 2000, { isStatic: true, label: "wall" });
    this.tag(ground, { type: "ground" });
    this.tag(backWall, { type: "ground" });
    Composite.add(this.engine.world, [ground, backWall]);

    for (const def of level.blocks) this.addBlock(def);
    for (const def of level.rabbits) this.addRabbit(def);

    Events.on(this.engine, "collisionStart", (e) => this.onCollisions(e.pairs));
  }

  get rabbitsLeft(): number {
    return this.rabbits.length;
  }

  get canBark(): boolean {
    return this.phase === "flying" && this.dog !== null && !this.barkUsed;
  }

  /** Update the aim while the player drags. `pull` is the offset from the anchor. */
  aim(pull: Vec): void {
    if (this.phase !== "aiming") return;
    this.pull = clampPull(pull);
  }

  /** Let go of the leash. Returns false if the pull was too short to count. */
  release(): boolean {
    if (this.phase !== "aiming") return false;
    const p = this.pull;
    if (Math.hypot(p.x, p.y) < 18) {
      this.pull = { x: 0, y: 0 };
      return false;
    }
    const dog = Bodies.circle(ANCHOR.x + p.x, ANCHOR.y + p.y, DOG_RADIUS, {
      density: 0.004,
      friction: 0.6,
      frictionAir: 0,
      restitution: 0.25,
      label: "dog",
    });
    this.tag(dog, { type: "dog" });
    Composite.add(this.engine.world, dog);
    Body.setVelocity(dog, launchVelocity(p));
    this.dog = dog;
    this.dogsLeft -= 1;
    this.dogsUsed += 1;
    this.barkUsed = false;
    this.flightSteps = 0;
    this.restSteps = 0;
    this.pull = { x: 0, y: 0 };
    this.phase = "flying";
    this.events.launch?.();
    return true;
  }

  /** Mid-air bark: shoves everything nearby and frightens close rabbits. */
  bark(): boolean {
    if (!this.canBark || !this.dog) return false;
    this.barkUsed = true;
    const { x, y } = this.dog.position;
    this.effects.push({ kind: "bark", x, y, age: 0 });
    this.events.bark?.();

    for (const body of Composite.allBodies(this.engine.world)) {
      if (body.isStatic || body === this.dog) continue;
      const dx = body.position.x - x;
      const dy = body.position.y - y;
      const dist = Math.hypot(dx, dy);
      if (dist > BARK_RADIUS || dist < 1) continue;
      const falloff = 1 - dist / BARK_RADIUS;
      Sleeping.set(body, false);
      const push = 0.045 * falloff * body.mass;
      Body.applyForce(body, body.position, { x: (dx / dist) * push, y: (dy / dist) * push - push * 0.3 });

      const tag = this.tags.get(body.id);
      if (tag?.type === "rabbit" && dist < BARK_SCARE_RADIUS) {
        this.hurtRabbit(tag.state, 40 * (1 - dist / BARK_SCARE_RADIUS) + 12);
      } else if (tag?.type === "block") {
        this.hurtBlock(tag.state, 18 * falloff);
      }
    }
    return true;
  }

  step(): void {
    if (this.phase === "won" || this.phase === "lost") {
      this.ageEffects();
      return;
    }
    Engine.update(this.engine, STEP_MS);
    this.steps += 1;
    this.ageEffects();
    for (const r of this.rabbits) r.flinch += 1;

    // Anything knocked off the stage counts as gone.
    for (const r of [...this.rabbits]) {
      const p = r.body.position;
      if (p.x > WORLD_W + 80 || p.y > GROUND_Y + 200) this.scareRabbit(r);
    }
    for (const b of [...this.blocks]) {
      const p = b.body.position;
      if (p.x > WORLD_W + 200 || p.y > GROUND_Y + 300) this.removeBlock(b, false);
    }

    if (this.rabbits.length === 0 && this.winCountdown < 0) {
      this.winCountdown = WIN_DELAY_STEPS;
    }
    if (this.winCountdown >= 0) {
      this.winCountdown -= 1;
      if (this.winCountdown <= 0) this.finish(true);
      return;
    }

    if (this.phase === "flying") this.updateFlight();
  }

  /** Total result once the level has ended. */
  result(): SessionResult {
    const won = this.phase === "won";
    return {
      won,
      score: this.score,
      dogsUsed: this.dogsUsed,
      stars: starsFor(this.level, this.dogsUsed, won),
    };
  }

  private updateFlight(): void {
    this.flightSteps += 1;
    const dog = this.dog;
    const outOfBounds = dog !== null && (dog.position.x > WORLD_W + 30 || dog.position.y > GROUND_Y + 300);

    // A ball rolls forever; a beagle digs in its paws once it lands.
    if (dog && dog.position.y > GROUND_Y - DOG_RADIUS - 3) {
      Body.setVelocity(dog, { x: dog.velocity.x * 0.93, y: dog.velocity.y });
      Body.setAngularVelocity(dog, dog.angularVelocity * 0.85);
    }

    let moving = false;
    for (const body of Composite.allBodies(this.engine.world)) {
      if (body.isStatic || body.isSleeping) continue;
      if (body.speed > REST_SPEED || body.angularSpeed > 0.02) {
        moving = true;
        break;
      }
    }
    this.restSteps = moving ? 0 : this.restSteps + 1;

    const settled = this.flightSteps > 60 && this.restSteps >= REST_STEPS;
    if (outOfBounds || settled || this.flightSteps >= MAX_FLIGHT_STEPS) this.endTurn();
  }

  private endTurn(): void {
    if (this.dog) {
      Composite.remove(this.engine.world, this.dog);
      this.tags.delete(this.dog.id);
      this.dog = null;
    }
    if (this.rabbits.length === 0) return; // win countdown handles it
    if (this.dogsLeft > 0) {
      this.phase = "aiming";
    } else {
      this.finish(false);
    }
  }

  private finish(won: boolean): void {
    if (this.phase === "won" || this.phase === "lost") return;
    if (won) this.score += this.dogsLeft * POINTS.spareDog;
    this.phase = won ? "won" : "lost";
    if (this.dog) {
      Composite.remove(this.engine.world, this.dog);
      this.dog = null;
    }
    this.events.finished?.(this.result());
  }

  private onCollisions(pairs: Matter.Pair[]): void {
    if (this.steps < GRACE_STEPS) return;
    for (const pair of pairs) {
      const a = pair.bodyA.parent;
      const b = pair.bodyB.parent;
      const n = pair.collision.normal;
      const rel = (a.velocity.x - b.velocity.x) * n.x + (a.velocity.y - b.velocity.y) * n.y;
      const impact = Math.abs(rel);
      if (impact < MIN_IMPACT) continue;
      if (impact > 4) this.events.thud?.(Math.min(1, impact / 16));
      this.applyHit(a, b, impact);
      this.applyHit(b, a, impact);
    }
  }

  /** `target` takes damage from being struck by `other`. */
  private applyHit(target: Matter.Body, other: Matter.Body, impact: number): void {
    const tag = this.tags.get(target.id);
    if (!tag || (tag.type !== "block" && tag.type !== "rabbit")) return;
    const otherTag = this.tags.get(other.id);
    const weight = other.isStatic ? 1.2 : Math.min(2, Math.max(0.4, Math.sqrt(other.mass / 4)));
    const bonus = otherTag?.type === "dog" ? DOG_HIT_BONUS : 1;
    const damage = (impact - MIN_IMPACT) * DAMAGE_SCALE * weight * bonus;
    if (tag.type === "block") this.hurtBlock(tag.state, damage);
    else this.hurtRabbit(tag.state, damage);
  }

  private hurtBlock(block: BlockState, damage: number): void {
    if (!this.blocks.includes(block)) return;
    block.health -= damage;
    if (block.health <= 0) this.removeBlock(block, true);
  }

  private hurtRabbit(rabbit: RabbitState, damage: number): void {
    if (!this.rabbits.includes(rabbit)) return;
    rabbit.health -= damage;
    rabbit.flinch = 0;
    if (rabbit.health <= 0) this.scareRabbit(rabbit);
  }

  private removeBlock(block: BlockState, broken: boolean): void {
    this.blocks = this.blocks.filter((b) => b !== block);
    this.tags.delete(block.body.id);
    Composite.remove(this.engine.world, block.body);
    if (!broken) return;
    const spec = MATERIALS[block.def.material];
    const { x, y } = block.body.position;
    this.score += spec.points;
    this.effects.push({ kind: "points", x, y, value: spec.points, age: 0 });
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + block.id;
      this.effects.push({
        kind: "debris",
        x,
        y,
        vx: Math.cos(a) * (2 + (i % 3)),
        vy: Math.sin(a) * 2 - 3,
        color: i % 2 ? spec.fill : spec.edge,
        size: 5 + (i % 3) * 3,
        age: 0,
      });
    }
    this.events.blockBroken?.(block.def.material);
  }

  private scareRabbit(rabbit: RabbitState): void {
    if (!this.rabbits.includes(rabbit)) return;
    this.rabbits = this.rabbits.filter((r) => r !== rabbit);
    this.tags.delete(rabbit.body.id);
    Composite.remove(this.engine.world, rabbit.body);
    const { x, y } = rabbit.body.position;
    this.score += POINTS.rabbit;
    this.effects.push({ kind: "flee", x, y, size: rabbit.def.size, age: 0 });
    this.effects.push({ kind: "points", x, y: y - 30, value: POINTS.rabbit, age: 0 });
    this.events.rabbitScared?.();
  }

  private addBlock(def: BlockDef): void {
    const spec = MATERIALS[def.material];
    const body = Bodies.rectangle(def.x, def.y, def.w, def.h, {
      angle: def.angle ?? 0,
      density: spec.density,
      friction: spec.friction,
      frictionStatic: 1,
      restitution: 0.05,
      label: def.material,
    });
    const state: BlockState = { id: this.nextId++, def, body, health: spec.health, maxHealth: spec.health };
    this.blocks.push(state);
    this.tag(body, { type: "block", state });
    Composite.add(this.engine.world, body);
  }

  private addRabbit(def: RabbitDef): void {
    const body = Bodies.circle(def.x, def.y, RABBIT_RADIUS[def.size], {
      density: 0.0012,
      friction: 1,
      frictionStatic: 2,
      restitution: 0.1,
      label: "rabbit",
    });
    // Rabbits slide and tumble off ledges but never roll like a ball.
    Body.setInertia(body, Infinity);
    const state: RabbitState = { id: this.nextId++, def, body, health: RABBIT_HEALTH[def.size], flinch: 999 };
    this.rabbits.push(state);
    this.tag(body, { type: "rabbit", state });
    Composite.add(this.engine.world, body);
  }

  private tag(body: Matter.Body, tag: Tag): void {
    this.tags.set(body.id, tag);
  }

  private ageEffects(): void {
    for (const fx of this.effects) {
      fx.age += 1;
      if (fx.kind === "debris") {
        fx.x += fx.vx;
        fx.y += fx.vy;
        fx.vy += 0.35;
      }
    }
    this.effects = this.effects.filter((fx) => {
      switch (fx.kind) {
        case "bark":
          return fx.age < 30;
        case "flee":
          return fx.age < 90;
        case "debris":
          return fx.age < 50;
        case "points":
          return fx.age < 60;
      }
    });
  }
}
