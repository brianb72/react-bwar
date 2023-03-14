/**
 * This guide gives all needed theory to work with hex grids:
 * "Hexagonal Grids" from "Red Blob Games" (https://www.redblobgames.com/grids/hexagons/)
 *
 * The coordinate class works with two types of coordinates:
 *    Cartesian: X and Y coordinates from 0 to axis size.
 *    Cubic: Q R S cubic coordinates
 
 */


import './shared-types.js'

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

  // /////////////////////////////////////////////////////////////////////////
  // Converting Coordinates Types

  /**
   * Convert a cubic coordinate to a cartesian coordinate. The cube.s is not used.
   * @param {CubeCoordinate} cube
   * @returns CartCoordinate
   */
  static cubeToCart(cube) {
    const { q, r } = cube;
    return { x: q, y: r + ((q + (q & 1)) >> 1) };
  }

  /**
   * Convert a cartesian coordinate to a cubic coordinate.
   * @param {CartCoordinate} cart
   * @returns CubeCoordinate
   */
  static cartToCube(cart) {
    const { x, y } = cart;
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
}
