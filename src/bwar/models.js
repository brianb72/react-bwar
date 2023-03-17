import { UnitStack } from "./unit-stack";

// For all Id:  0 is invalid, 1 is first valid

export const TerrainData = {
  0: { name: "Invalid", color: "None", moveCost: undefined },
  1: { name: "Open", color: "White", moveCost: 0 },
  2: { name: "Grass", color: "LightGreen", moveCost: 5 },
  3: { name: "Hill", color: "SandyBrown", moveCost: 10 },
  4: { name: "Road", color: "Gray", moveCost: 1 },
  5: { name: "Water", color: "SkyBlue", moveCost: undefined },
  6: { name: "City", color: "Gold", moveCost: 1 },
};

export const TerrainNames = {
  Invalid: 0,
  Open: 1,
  Grass: 2,
  Hill: 3,
  Road: 4,
  Water: 5,
  City: 6,
};

export function Unit(_unit) {
  this.unitId = _unit.unitId || 0;
  this.forceId = _unit.forceId || 0;
  this.formationId = _unit.formationId || 0;
  this.name = _unit.name || "";
  this.hexCoord = { ..._unit.hexCoord };
  this.unitColors = new CounterColors(_unit.unitColors);
  this.symbolName = _unit.symbolName;
  this.unitSize = _unit.unitSize;
  this.values = { ..._unit.values } || {};

  this.svgLayers = {
    base: undefined, // Base group holding the entire counter
  };
}

export function Hex(_hex) {
  this.hexCoord = _hex.hexCoord;
  this.terrainId = _hex.terrainId || 0;
  this.moveCost = _hex.moveCost || undefined;
  this.hexSvg = undefined; // Handle to hex SVG object
  this.unitStack = new UnitStack();
}


export function CounterColors(_colors) {
  this.counterForeground = _colors.counterForeground;
  this.counterBackground = _colors.counterBackground;
  this.symbolForeground = _colors.symbolForeground;
  this.symbolBackground = _colors.symbolBackground;
}
