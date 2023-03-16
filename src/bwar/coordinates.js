/**
 * This guide gives all needed theory to work with hex grids:
 * "Hexagonal Grids" from "Red Blob Games" (https://www.redblobgames.com/grids/hexagons/)
 *
 * The coordinate class works with two types of coordinates:
 *    Cartesian: X and Y coordinates from 0 to axis size.
 *    Cubic: Q R S cubic coordinates
 
 */

import "./shared-types.js";

/** Enumerates the 6 directions that a flat topped hex can be exited, N NE SE S SW NW */
// const Directions = { N: 0, NE: 1, SE: 2, S: 3, SW: 4, NW: 5 };

/** Enumerates the cubic transforms need to move in each Directions */
const cubeNeighborDirections = [
  { q: 0, r: -1, s: 1 }, // N
  { q: 1, r: -1, s: 0 }, // NE
  { q: 1, r: 0, s: -1 }, // SE
  { q: 0, r: 1, s: -1 }, // S
  { q: -1, r: 1, s: 0 }, // SW
  { q: -1, r: 0, s: 1 }, // NW
];

export class Coordinates {
  // /////////////////////////////////////////////////////////////////////////
  // Creating Coordinates

  /**
   * Makes a cart coordinate
   * @param {number} x The X coordinate
   * @param {number} y The Y coordinate
   * @returns {CartCoordinate}
   */
  static makeCart(x, y) {
    return { x: x, y: y };
  }

  /**
   * Makes a cube coordinate
   * @param {number} q The Q coordinate
   * @param {r} r The R coordinate
   * @param {s} s The S coordinate
   * @returns {CubeCoordinate}
   */
  static makeCube(q, r, s) {
    return { q: q, r: r, s: s };
  }

  // /////////////////////////////////////////////////////////////////////////
  // Testing Coordinates Types

  /**
   * Tests if an unknown coordinate is a cart coordinate
   * @param {UnknownCoordinate} unknown_coord A coordinate object of unknown type
   * @returns {boolean} true if unknown_coord is a cart coordinate
   */
  static isCoordCart(unknown_coord) {
    try {
      return (
        unknown_coord.hasOwnProperty("x") && unknown_coord.hasOwnProperty("y")
      );
    } catch {
      return false;
    }
  }

  /**
   * Tests if an unknown coordinate is a cube coordinate
   * @param {UnknownCoordinate} unknown_coord A coordinate object of unknown type
   * @returns {boolean} true if unknown_coord is a cube coordinate
   */
  static isCoordCube(unknown_coord) {
    try {
      return (
        unknown_coord.hasOwnProperty("q") &&
        unknown_coord.hasOwnProperty("r") &&
        unknown_coord.hasOwnProperty("s")
      );
    } catch {
      return false;
    }
  }

  /**
   * Tests if two cart coordinates are equal. 
   * Undefined or invalid coordinates are not equal to anything
   * @param {CartCoordinate} cartA First coordinate to test
   * @param {CartCoordinate} cartB Second coordinate to test
   * @returns {boolean} True if coordinates are equal
   */
  static isCoordsEqual(cartA, cartB) {
    try {
      // An undefined coordinate is not equal to any coordinate, including undefined
      if (cartA === undefined || cartB === undefined) {
        return false;
      }
      // Return if x/y values match
      return cartA.x === cartB.x & cartA.y === cartB.y;
    } catch {
      // If either coordinates are missing an x or y they are invalid and not equal
      return false;
    }
  }

  // /////////////////////////////////////////////////////////////////////////
  // Converting Coordinates Types

  /**
   * Convert a cubic coordinate to a cartesian coordinate. 
   * @param {CubeCoordinate} cube
   * @returns {CartCoordinate}
   */
  static cubeToCart(cube) {
    // cube.s is not used
    const { q, r } = cube;
    if (q === undefined || r === undefined) { return undefined }
    return { x: q, y: r + ((q + (q & 1)) >> 1) };
  }

  /**
   * Convert a cartesian coordinate to a cubic coordinate.
   * @param {CartCoordinate} cart
   * @returns CubeCoordinate
   */
  static cartToCube(cart) {
    const { x, y } = cart;
    if (x === undefined || y === undefined) { return undefined }
    const q = x;
    const r = y - ((x + (x & 1)) >> 1);
    return { q: q, r: r, s: -q - r };
  }

  // /////////////////////////////////////////////////////////////////////////
  // Manipulating Coordinates

  /**
   * Rounds a cube coordinate
   * @param {CubeCoordinate} cube
   * @returns CubeCoordinate
   */
  static roundCube(cube) {
    const { q, r, s } = cube;
    let rQ = Math.round(q);
    let rR = Math.round(r);
    let rS = Math.round(s);
    const diffQ = Math.abs(q - rQ);
    const diffR = Math.abs(r - rR);
    const diffS = Math.abs(s - rS);
    if (diffQ > diffR && diffQ > diffS) {
      rQ = -rR - rS;
    } else if (diffR > diffS) {
      rR = -rQ - rS;
    } else {
      rS = -rQ - rR;
    }
    return { q: rQ, r: rR, s: rS };
  }

  static roundCubeToCart(cube) {
    return this.cubeToCart(this.roundCube(cube));
  }

  // /////////////////////////////////////////////////////////////////////////
  // Coordinate calculations

  /**
   * Returns the number of hexes between source and target
   * @param {CartCoordinate} sourceHexCoord Coordinate of source hex
   * @param {CartCoordinate} targetHexCoord Coordinate of target hex
   * @returns {number | undefined} Number of hexes between source and target, or undefined if invalid coordinates or off map
   */
  static hexDistance(sourceHexCoord, targetHexCoord) {
    try {
      const a = this.cartToCube(sourceHexCoord);
      const b = this.cartToCube(targetHexCoord);
      return Math.max(Math.abs(a.q - b.q), Math.abs(a.r - b.r), Math.abs(a.s - b.s));
    } catch {
      return undefined; // silently ignore errors, caller will handle
    }
  }


  /**
   * Get an array of hexCoords that are neighbors of sourceHexCoord, some returned hexes may not be on map
   * @param {CartCoordinate} sourceHexCoord Hex coordinate to get neighbors of
   * @returns {Array.<CartCoordinate>} Coordinates that are neighbors of sourceHexCoord
   */
  static neighborsOf(sourceHexCoord) {
    const cube = this.cartToCube(sourceHexCoord)
    let neighbors = []
    for (let direction = 0; direction < 6; ++direction) {
      const d = cubeNeighborDirections[direction]
      const nei = { q: cube.q + d.q, r: cube.r + d.r, s: cube.s + d.s }
      neighbors.push(this.cubeToCart(nei))
    }
    return neighbors
  }


  /**
   * Returns the Directions number needed to travel between sourceHexCoord to targetHexCoord
   * @param {CartCoordinate} sourceHexCoord Coordinate of source hex
   * @param {CartCoordinate} targetHexCoord Coordinate of target hex
   * @returns {number | undefined} The Directions number to travel from source to target, or undefined if hexes are not neighbors
   */
  static neighborsWhichDirection(sourceHexCoord, targetHexCoord) {
    try {
      const sourceCube = this.cartToCube(sourceHexCoord);
      const targetCube = this.cartToCube(targetHexCoord);

      // Step through every direction
      for (let dir = 0; dir < cubeNeighborDirections.length; ++dir) {
        const cubeAdjust = cubeNeighborDirections[dir];
        // Find the coordinate of the neighbor in direction dir
        const neiCoord = {
          q: sourceCube.q + cubeAdjust.q,
          r: sourceCube.r + cubeAdjust.r,
          s: sourceCube.s + cubeAdjust.s,
        };
        // If the neighbor equals target then return the current direction
        if (
          targetCube.q === neiCoord.q &&
          targetCube.r === neiCoord.r &&
          targetCube.s === neiCoord.s
        ) {
          return dir;
        }
      }

      // Direction not found, hexes are not neighbors
      return undefined;
    } catch {
      // TODO should this throw?
      console.log(
        `Coordinates.neighborsWhichDirection(): source [${sourceHexCoord}] or target [${targetHexCoord}] is invalid`
      );
      return undefined; // silent failure
    }
  }
}
