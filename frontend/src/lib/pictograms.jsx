// ~30 pictograms mapped to thick-stroke lucide icons (readable at 96px).
// Keys mirror backend/pictograms.py. Fallback to Square if a name is missing.
import {
  CupSoda, Milk, Snowflake, Coffee, Blend, Droplet, RotateCw, Candy,
  GlassWater, FlaskConical, Brush, Sparkles, Package, ShoppingBag, ScanLine,
  Shirt, ArrowDownUp, Tag, LayoutGrid, WashingMachine, Zap, Plug, Flame, Hand,
  Droplets, Banknote, CheckCheck, LifeBuoy, Check, HelpCircle, Square,
} from "lucide-react";

const MAP = {
  cup: CupSoda, milk: Milk, ice: Snowflake, coffee: Coffee, blender: Blend,
  pour: Droplet, mix: RotateCw, sugar: Candy, water: GlassWater,
  bottle: FlaskConical, broom: Brush, clean: Sparkles, box: Package,
  bag: ShoppingBag, scan: ScanLine, fold: Shirt, sort: ArrowDownUp, mark: Tag,
  shelf: LayoutGrid, wash: WashingMachine, iron: Zap, plug: Plug, hot: Flame,
  gloves: Hand, handwash: Droplets, cash: Banknote, check: Check,
  done: CheckCheck, ask: HelpCircle, help: LifeBuoy,
};

export const PICTOGRAM_KEYS = Object.keys(MAP);

export function Pictogram({ name, size = 40, strokeWidth = 2.5, className = "" }) {
  const Icon = MAP[name] || Square;
  return <Icon size={size} strokeWidth={strokeWidth} className={className} aria-hidden="true" />;
}
