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
 * @typedef {number} TerrainId Id of terrain type
 * 
 * 
 * @typedef {Object} HexModel
 * @property {CartCoordinate} hexCoord Coordinates of hex
 * @property {number} terrainId Terrain type Id
 * @property {Object} hexSVG    SVG Handle to hex drawn on view
 * @property {Object} unitStack UnitStack class holding all units in hex
 * 
 * 
 * @typedef {Object} UnitModel
 * @property {CartCoordinate} hexCoord Coordinates of hex unit is in
 * @property {number} unitId Unit Id
 * @property {Object} hexSVG SVG Handle to hex drawn on view
 * 
 * @typedef {Object} TerrainData
 * @property {string} name Name of terrain
 * @property {string} color "#RGB" color to fill hex
 * @property {number} moveCost Cost to move through the hex for the pathfinding algorithm
 * 
 * 
*/
