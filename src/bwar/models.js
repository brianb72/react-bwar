import { UnitStack } from "./unit-stack";

// Id of 0 is invalid, 1 is first valid

export const TerrainData = {
  0: { name: "Invalid", color: "None", moveCost: undefined },
  1: { name: "Open", color: "White", moveCost: 1 },
  2: { name: "Grass", color: "LightGreen", moveCost: 2 },
  3: { name: "Hill", color: "SandyBrown", moveCost: 3 },
  4: { name: "Road", color: "Gray", moveCost: 1 },
  5: { name: "Water", color: "SkyBlue", moveCost: 1 },
};

export const TerrainNames = {
  Invalid: 0,
  Open: 1,
  Grass: 2,
  Hill: 3,
  Road: 4,
  Water: 5,
};

export function Unit(_unit) {
  this.unitId = _unit.unitId | 0;
  this.hexCoord = _unit.hexCoord;
  this.svgLayers = {
    base: undefined, // Base group holding the entire counter
  };
}

export function Hex(_hex) {
  this.hexCoord = _hex.hexCoord;
  this.terrainId = _hex.terrainId | 0;
  this.hexSVG = undefined; // Handle to hex SVG object
  this.unitStack = new UnitStack();
}
