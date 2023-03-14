import { Coordinates } from "./bwar/coordinates";

describe("Coordinates", () => {

  test('makeCart(4, 8) should result in "{ x: 4, y: 8 }"', () => {
    expect(Coordinates.makeCart(4, 8)).toStrictEqual({ x: 4, y: 8 });
  });

  test('makeCube(0, 1, -1) should result in "{ q: 0, r: 1, s: -1 }"', () => {
    expect(Coordinates.makeCube(0, 1, -1)).toStrictEqual({ q: 0, r: 1, s: -1 });
  });

  test('Coordinates.isCoordCart({ x: 4, y: 8 }) should result in "true"', () => {
    expect(Coordinates.isCoordCart({ x: 4, y: 8 })).toBe(true);
  });


  test('Coordinates.isCoordCube({ q: 0, r: 1, s: -1 }) should result in "true"', () => {
    expect(Coordinates.isCoordCube({ q: 0, r: 1, s: -1 })).toBe(true);
  });


  test('Coordinates.isCoordCart({ q: 0, r: 1, s: -1 }) should result in "false"', () => {
    expect(Coordinates.isCoordCart({ q: 0, r: 1, s: -1 })).toBe(false);
  });

  test('Coordinates.isCoordCube({ f: 5 }) should result in "false"', () => {
    expect(Coordinates.isCoordCube({ f: 5})).toBe(false);
  });

  test('Coordinates.isCoordCart(null) should result in "false"', () => {
    expect(Coordinates.isCoordCart(null)).toBe(false);
  });

  test('Coordinates.isCoordCube(5) should result in "false"', () => {
    expect(Coordinates.isCoordCube(5)).toBe(false);
  });

});
