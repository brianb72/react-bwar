/**
 * @typedef {Object} UnknownCoordinate A coordinate object of unknown type. Type can be determined from properties.
 *
 * @typedef {Object} CartCoordinate
 * @property {number} x The X coordinate
 * @property {number} y The Y coordinate
 *
 * @typedef {Object} CubeCoordinate
 * @property {number} q The Q coordinate
 * @property {number} r The R coordinate
 * @property {number} s The S coordinate
 *
 *
 *
 *
 * @typedef {number} UnitId Id of a Unit
 * @typedef {number} TerrainId Id of a terrain type
 * @typedef {number} SideId Id of a side in the OOB
 * @typedef {number} ForceId Id of a force in the OOB
 * @typedef {number} FormationId Id of a formation in the OOB
 *
 *
 * @typedef {Object} HexModel
 * @property {CartCoordinate} hexCoord Coordinates of hex
 * @property {number} terrainId Terrain type Id
 * @property {string} label Text label drawn on hex
 * @property {number} victoryPoints Victory point value of hex
 * @property {Object} hexSVG    SVG Handle to hex drawn on view
 * @property {Object} unitStack UnitStack class holding all units in hex
 *
 *
 *
 * @typedef {Object} SideModel
 * @property {SideId} sideId Id of side
 * @property {string} sideName Name of side
 * @property {Set.<ForceId>} forces Set of force Id that are members of this side
 *
 * @typedef {Object} ForceModel
 * @property {ForceId} forceId Id of force
 * @property {string} forceName Name of force
 * @property {Set.<FormationId>} formations Set of formation Id that are members of this force
 *
 * @typedef {Object} FormationModel
 * @property {FormationId} FormationId Id of Formation
 * @property {string} FormationName Name of Formation
 * @property {Set.<UnitId>} units Set of unit Id that are members of this Formation
 *
 * @typedef {Object} UnitModel
 * @property {number} unitId Unit Id
 * @property {Object} hexSVG SVG Handle to hex drawn on view
 * @property {number} forceId Force the unit is in
 * @property {number} formationId Formation the unit is in
 * @property {string} name Name of unit
 * @property {CartCoordinate} hexCoord Hex coordinate unit is in
 * @property {CounterColors} unitColor Colors used by the unit
 *
 *
 * @typedef {Object} CounterColors
 * @property {string} counterForeground "#RRGGBB" color used to stroke foreground lines of the counter
 * @property {string} counterBackground "#RRGGBB" color used to fill background of the counter
 * @property {string} symbolForeground "#RRGGBB" color used to stroke foreground lines of the symbol area on the counter
 * @property {string} symbolBackground "#RRGGBB" color used to fill background of the symbol area on the counter
 *
 *
 * @typedef {Object} TerrainData
 * @property {string} name Name of terrain
 * @property {string} color "#RGB" color to fill hex
 * @property {number} moveCost Cost to move through the hex for the pathfinding algorithm
 *
 * @typedef {Object} ScenarioData
 * @property {string} name Name of scenario
 * @property {number} mapHexWidth Width of map in hexes
 * @property {number} mapHexHeight Height of map in hexes
 * @property {Array.<HexModel>} hexes Array of HexModels making up the map
 * @property {Array} sides Array of side objects
 * @property {Array} forces Array of forces objects, which contain formations and units
 */
