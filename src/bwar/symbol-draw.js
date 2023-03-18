/*
    SymbolDraw class is passed a unit.svgLayers.symbol, some parameters like height and width, and draws a symbol in the SVG group.

        An Element is a small set of drawn items that are either their own symbol or are used to build more complex symbols.
        A Recipe is a list of elements needed to make a symbol.

        SymbolDraw looks up the recipe for the unit's symbolName, and draws each element in the recipe.

        The NATO element for "Cavalry" is a single diagonal line "/".
        The NATO element for "Infantry" is two diagonal lines "X".
        The NATO element for "Tank" is a horizontal ellipse "O".
        A NATO element for "Motorized" is a single dot in each lower corner ". ."

        The "/" "X" "O" are elements, which can be combined to produce more complex symbols. Each element provides
        information about the units attributes.
        
        Drawing the "Infantry" element produces symbol "Infantry"
            recipe = ['Infantry']

        Drawing the "Tank" element produces symbol "Tank"
            recipe = ['Tank']
            
        Drawing the "Infantry" element and "Tank" element produces symbol "Mechanized Infantry"
            recipe = ['Infantry', 'Tank']

        Drawing the "Infantry" element and the "Motorized" element produces symbol "Motorized Infantry"
            recipe = ['Infantry', 'Motorized']

            Drawing the "Cavalry" element with "Tank" produces symbol "Mechanized Cavalry"
            recipe = ['Cavalry', 'Tank']

        
*/

export class SymbolDraw {
  static recipes = {
    None: [],
    Cavalry: ["Cavalry"],
    Infantry: ["Infantry"],
    Tank: ["Tank"],
    "Motorized Infantry": ["Motorized", "Infantry"],
    "Mechanized Infantry": ["Tank", "Infantry"],
    "Armored Cavalry": ["Tank", "Cavalry"],
    Artillery: ["Artillery"],
    "Motorized Artillery": ["Motorized", "Artillery"],
  };

  static drawSymbol(
    svgSymbol,
    symbolName,
    drawColor,
    svgWidth,
    svgHeight,
    cornerRounding
  ) {
    // Look up the recipe, silently ignore if not found or nothing to draw
    const recipe = SymbolDraw.recipes[symbolName];
    if (!recipe || recipe.length === 0) {
      console.log(
        `SymbolDrawer.drawSymbol(): Unknown symbolName ${JSON.stringify(
          symbolName
        )}`
      );
      return;
    }

    // Convience variables
    const w = svgWidth;
    const h = svgHeight;
    const ra = cornerRounding * 0.25;
    // let dotr, mora;
    let s_per_x, s_per_y; // scales horizontal and vertical sizes
    // let w_off, h_off, bw, rw, rh;

    for (let i = 0; i < recipe.length; ++i) {
      switch (recipe[i]) {
        case "Infantry":
          svgSymbol
            .line(0 + ra, 0 + ra, w - ra, h - ra)
            .stroke({ color: drawColor, opacity: 1.0, width: 1 });
          svgSymbol
            .line(0 + ra, h - ra, w - ra, 0 + ra)
            .stroke({ color: drawColor, opacity: 1.0, width: 1 });
          break;

        case "Tank":
          s_per_x = 0.15;
          s_per_y = 0.2;
          svgSymbol
            .ellipse(w * (1 - s_per_x * 2), h * (1 - s_per_y * 2))
            .stroke({ color: drawColor, opacity: 1.0, width: 1 })
            .move(w * s_per_x, h * s_per_y)
            .fill("none");
          break;

        default:
          console.log('SymbolDraw.drawSymbol(): Unknown recipe element ', recipe[i]);
      }
    }
  }
}
