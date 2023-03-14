import { BWARView } from "./view";
import { BWARModel } from "./model";
import { Coordinates } from "./coordinates";
import { TerrainNames } from "./models";

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
    this.model = new BWARModel(mapHexWidth, mapHexHeight, {});

    // Add some map terrain
    this.setMapTerrainId(0, 2, TerrainNames.Water)
    this.setMapTerrainId(1, 2, TerrainNames.Water)
    this.setMapTerrainId(2, 2, TerrainNames.Water)
    this.setMapTerrainId(2, 3, TerrainNames.Water)
    this.setMapTerrainId(3, 4, TerrainNames.Water)
    this.setMapTerrainId(4, 3, TerrainNames.Road)
    this.setMapTerrainId(5, 4, TerrainNames.Water)
    this.setMapTerrainId(6, 3, TerrainNames.Water)
    this.setMapTerrainId(4, 4, TerrainNames.Road)
    this.setMapTerrainId(4, 5, TerrainNames.Road)
    this.setMapTerrainId(4, 6, TerrainNames.Road)
    this.setMapTerrainId(4, 2, TerrainNames.Road)
    this.setMapTerrainId(4, 1, TerrainNames.Road)
    this.setMapTerrainId(5, 1, TerrainNames.Road)
    this.setMapTerrainId(6, 0, TerrainNames.Road)
    this.setMapTerrainId(6, 0, TerrainNames.Road)
    this.setMapTerrainId(1, 5, TerrainNames.Hill)
    this.setMapTerrainId(0, 5, TerrainNames.Hill)
    this.setMapTerrainId(0, 4, TerrainNames.Hill)

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
    }
    const svgContainer = this.view.getSvgContainer();
    svgContainer.addTo(targetDivElement);
  }

  /* ************************************************************************
        Misc utility
   ************************************************************************ */

  setMapTerrainId(x, y, terrainId) {
    const hexCoord = Coordinates.makeCart(x, y);
    const hex = this.model.getHex(hexCoord)
    hex.terrainId = terrainId;
  }


}
