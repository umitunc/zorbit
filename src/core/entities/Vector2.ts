export interface Vector2 {
  x: number;
  y: number;
}

export interface CircleBounds {
  x: number;
  y: number;
  radius: number;
}

export function distanceBetween(a: Vector2, b: Vector2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

export function angleBetween(from: Vector2, to: Vector2): number {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

export function circlesOverlap(a: CircleBounds, b: CircleBounds): boolean {
  const dist = distanceBetween(a, b);
  return dist <= a.radius + b.radius;
}

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
