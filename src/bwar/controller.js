import { BWARView } from "./view";
import { BWARModel } from "./model";
import { Coordinates } from "./coordinates";
import { TerrainNames, Unit } from "./models";

import "@svgdotjs/svg.panzoom.js";
import "./shared-types.js";

export class BWARController {
  /**
   * Constructor
   * @param {number} mapHexWidth Number of hexes wide
   * @param {number} mapHexHeight Number of hexes tall
   * @param {Function} setLastHexClicked React useState() setter
   */
  constructor(mapHexWidth, mapHexHeight, setLastHexClicked) {
    console.log(
      `   ...BWAR Constructor mapSize: ${mapHexWidth} x ${mapHexHeight}`
    );
    this.view = undefined;
    this.mapHexWidth = mapHexWidth;
    this.mapHexHeight = mapHexHeight;
    this.mapSize = { height: mapHexHeight, width: mapHexWidth };
    this.setLastHexClicked = setLastHexClicked;
    this.model = new BWARModel(mapHexWidth, mapHexHeight);

    // Add some map terrain
    this.setMapTerrainId(0, 2, TerrainNames.Water);
    this.setMapTerrainId(1, 2, TerrainNames.Water);
    this.setMapTerrainId(2, 2, TerrainNames.Water);
    this.setMapTerrainId(2, 3, TerrainNames.Water);
    this.setMapTerrainId(3, 4, TerrainNames.Water);
    this.setMapTerrainId(4, 3, TerrainNames.Road);
    this.setMapTerrainId(5, 4, TerrainNames.Water);
    this.setMapTerrainId(6, 3, TerrainNames.Water);
    this.setMapTerrainId(4, 4, TerrainNames.Road);
    this.setMapTerrainId(4, 5, TerrainNames.Road);
    this.setMapTerrainId(4, 6, TerrainNames.Road);
    this.setMapTerrainId(4, 2, TerrainNames.Road);
    this.setMapTerrainId(4, 1, TerrainNames.Road);
    this.setMapTerrainId(5, 1, TerrainNames.Road);
    this.setMapTerrainId(6, 0, TerrainNames.Road);
    this.setMapTerrainId(6, 0, TerrainNames.Road);
    this.setMapTerrainId(1, 5, TerrainNames.Hill);
    this.setMapTerrainId(0, 5, TerrainNames.Hill);
    this.setMapTerrainId(0, 4, TerrainNames.Hill);

    const unit = new Unit({
      unitId: 1,
      hexCoord: Coordinates.makeCart(4, 2),
    });

    this.model.addUnit(unit);
  }

  /**
   * Do anything needed on view creation
   */
  setupView() {
    this.view.createUnitCountersForAllUnits();
  }

  /**
   * Create a new view or reuse the old view, and attach to the target div
   * @param {Object} targetDivElement div in the DOM that holds the SVG
   */
  attachView(targetDivElement) {
    if (this.view) {
      console.log("   ...BWARVIEW exists, reusing");
    } else {
      this.view = new BWARView(
        this,
        this.model,
        this.mapHexWidth,
        this.mapHexHeight,
        this.setLastHexClicked
      );
      this.setupView();
    }
    const svgContainer = this.view.getSvgContainer();
    svgContainer.addTo(targetDivElement);
  }

  /* ************************************************************************
        Units utility
   ************************************************************************ */

  /**
   * Moves a unit in both the view and model
   * @param {UnitId} unitId Id of unit to move
   * @param {CartCoordinate} hexCoord Hex coordinate to move unit to
   */
  moveUnitIdToHexCoord(unitId, hexCoord) {
    if (this.view) {
      // Move the unit in the view
      this.view.moveUnitIdToHexCoord(unitId, hexCoord);
    }

    // Move the unit in the model
    this.model.moveUnitIdToHexCoord(unitId, hexCoord);
  }

  /* ************************************************************************
        Misc utility
   ************************************************************************ */

  /**
   * Sets the terrainId of a hex
   * @param {number} x X coordinate
   * @param {number} y Y coordinate
   * @param {number} terrainId Id of terrain to set hex to
   */
  setMapTerrainId(x, y, terrainId) {
    const hexCoord = Coordinates.makeCart(x, y);
    const hex = this.model.getHex(hexCoord);
    hex.terrainId = terrainId;
  }
}
