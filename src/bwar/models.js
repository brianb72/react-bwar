import { UnitStack } from "./tools/unit-stack";
import "./shared-types.js";

// For all Id:  0 is invalid, 1 is first valid


// {1, 5, 10, 12, 14}

export const TerrainData = {
  0: { name: "Invalid", color: "None", moveCost: undefined },
  1: { name: 'OutOfBounds', color: 'Black', moveCost: undefined },
  2: { name: "Open", color: "White", moveCost: 0 },
  3: { name: "Grass", color: "LightGreen", moveCost: 5 },
  4: { name: "Hill", color: "SandyBrown", moveCost: 10 },
  5: { name: 'Water', color: 'SkyBlue', moveCost: undefined },
  10: { name: "City", color: "Gold", moveCost: 1 },
  12: { name: "Road", color: "Gray", moveCost: 1 },
  14: { name: 'Sand', color: 'LightGoldenRodYellow', moveCost: 7 },
};

export const TerrainNames = {
  Invalid: 0,
  OutOfBounds: 1,
  Open: 2,
  Grass: 3,
  Hill: 4,
  Water: 5,
  City: 10,
  Road: 12,
  Sand: 14,
};

export function SvgLayers() {
    this.base = undefined // Base group holding the entire counter
    this.symbol = undefined // Symbol group holding a drawn symbol based on symbolName
    this.values = {
      topLeft: undefined,
      topCenter: undefined,
      topRight: undefined,
      bottomLeft: undefined,
      bottomCenter: undefined,
      bottomRight: undefined
  };
}

export function Unit(_unit) {
  this.unitId = _unit.unitId || _unit.id || 0;
  this.forceId = _unit.forceId || 0;
  this.formationId = _unit.formationId || 0;
  this.name = _unit.name || _unit.n || "";
  this.hexCoord = { ..._unit.hexCoord };
  this.unitColors = new CounterColors(_unit.unitColors || _unit.c);
  this.symbolName = _unit.symbolName || _unit.s;
  this.values = { ..._unit.values, ..._unit.v };

  this.svgLayers = new SvgLayers();
}  

export function Hex(_hex) {
  this.hexCoord = _hex.hexCoord || undefined;
  this.terrainId = _hex.terrainId || _hex.t || 0;
  this.label = _hex.label || _hex.l || undefined;
  this.victoryPoints = _hex.victoryPoints || _hex.v || undefined;
  this.moveCost = _hex.moveCost || undefined;
  this.hexSvg = undefined; // Handle to hex SVG object
  this.unitStack = new UnitStack();
}

export function CounterColors(_colors) {
  this.counterForeground = _colors.counterForeground || _colors.cf;
  this.counterBackground = _colors.counterBackground || _colors.cb;
  this.symbolForeground = _colors.symbolForeground || _colors.sf;
  this.symbolBackground = _colors.symbolBackground || _colors.sb;
}

export function UnitValues(_values) {
  this.attackSoft = _values.attackSoft || _values.s;
  this.attackHard = _values.attackHard || _values.h;
  this.attackAir = _values.attackAir || _values.a;
  this.defense = _values.defense || _values.d;
  this.moves = _values.moves || _values.m;
  this.unitSize = _values.unitSize || _values.us;
  this.unitType = _values.unittype || _values.ut || 'Soft';
  this.percentCondition = 1.0;
}