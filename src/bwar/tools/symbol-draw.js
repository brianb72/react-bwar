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
    "Anti Aircraft": ["Anti Aircraft"],
    Antitank: ["Antitank"],
    Artillery: ["Artillery"],
    "Armored Artillery": ["Artillery", "Tank"],
    "Armored Antitank": ["Antitank", "Tank"],
    "Armored Cavalry": ["Cavalry", "Tank"],
    Cavalry: ["Cavalry"],
    Headquarters: ["Headquarters"],
    "Coastal Artillery": ["Coastal Artillery"],
    Engineer: ["Engineer"],
    Fighter: ["Fighter"],
    "Fighter Bomber": ["Fighter Bomber"],
    Infantry: ["Infantry"],
    "Hvy Artillery": ["Hvy Artillery"],
    Kampfgruppe: ["Kampfgruppe"],
    "Light Bomber": ["Light Bomber"],
    "Machine Gun": ["Machine Gun"],
    "Mechanized Infantry": ["Infantry", "Tank"],
    Mechanized: ["Infantry", "Tank"], // some scenarios use Mechanized and Mechanized Infantry interchangably
    "Mountain Infantry": ["Infantry", "Mountain"],
    "Motor Artillery": ["Artillery", "Motorized"], // some scenarios use Motor/Motorized interchangably
    "Motorized Artillery": ["Artillery", "Motorized"],
    "Motor Antitank": ["Antitank", "Motorized"],
    "Motorized Antitank": ["Motorized", "Tank"],
    "Motor Anti Air": ["Anti Aircraft", "Motorized"],
    "Motorized Anti Air": ["Anti Aircraft", "Motorized"],
    "Motor Cavalry": ["Cavalry", "Motorized"],
    "Motorized Cavalry": ["Cavalry", "Motorized"],
    "Motor Hvy Wpns": ["Infantry", "Hvy Wpns", "Motorized"],
    "Motorized Hvy Wpns": ["Infantry", "Hvy Wpns", "Motorized"],
    "Motor Infantry": ["Motorized", "Infantry"],
    "Motorized Infantry": ["Motorized", "Infantry"],
    Tank: ["Tank"],

    // Sub icons, need replacements
    "Hvy Motor": ["Hvy Artillery"],
    "Hvy Antitank": ["Antitank", "Hvy Wpns"],
    "Motor Engineer": ["Engnieer", "Motorized"],
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
    let dotr, mora;
    let s_per_x, s_per_y; // scales horizontal and vertical sizes
    let w_off, h_off, bw, rw, rh;

    for (let i = 0; i < recipe.length; ++i) {
      switch (recipe[i]) {
        case "Antitank":
          svgSymbol
            .line(0 + ra, h - ra, w / 2, 0)
            .stroke({ color: drawColor, opacity: 1.0, width: 1 });
          svgSymbol
            .line(w / 2, 0, w - ra, h - ra)
            .stroke({ color: drawColor, opacity: 1.0, width: 1 });
          break;
        case "Anti Aircraft":
          mora = ra * 1.1;
          svgSymbol
            .path(
              `M${0 + mora} ${h - mora} C${0 + mora} ${h * 0.4 - mora} ${
                w - mora
              } ${h * 0.4 - mora} ${w - mora} ${h - mora}`
            )
            .stroke({ color: drawColor, opacity: 1.0, width: 1 })
            .fill("none");
          break;
        case "Artillery":
          dotr = w * 0.15;
          svgSymbol
            .circle(dotr)
            .stroke({ color: drawColor, opacity: 1.0, width: 1 })
            .move(w / 2 - dotr / 2, h / 2 - dotr / 2)
            .fill(drawColor);
          break;
        case "Cavalry":
          svgSymbol
            .line(0 + ra, h - ra, w - ra, 0 + ra)
            .stroke({ color: drawColor, opacity: 1.0, width: 1 });
          break;
        case "Coastal Artillery":
          svgSymbol
            .path(
              `M${w * 0.2} ${h * 0.7} C${w * 0.2} ${h * 0.3} ${w * 0.8} ${
                h * 0.3
              } ${w * 0.8} ${h * 0.7} Z`
            )
            .stroke({ color: drawColor, opacity: 1.0, width: 1 })
            .fill(drawColor);
          svgSymbol
            .line(w * 0.6, h * 0.5, w * 0.8, h * 0.25)
            .stroke({ color: drawColor, opacity: 1.0, width: 1 * 2.5 });
          break;
        case "Engineer":
          w_off = w * 0.2;
          h_off = h * 0.25;
          svgSymbol
            .path(
              `M${w_off} ${h - h_off} V${h_off} H${w - w_off} V${h - h_off} M${
                w / 2
              } ${h_off} V${h - h_off}`
            )
            .stroke({ color: drawColor, opacity: 1.0, width: 1 * 2.0 })
            .fill("none");
          break;
        case "Fighter":
          bw = 0.01; // vertical body line width
          svgSymbol
            .path(
              `M${w * 0.25} ${h * 0.33} H${w - w * 0.25} L${w / 2} ${
                h / 2
              } Z ` + // Wings
                `M${w / 2 - w * bw} ${h * 0.2} H${w / 2 + w * bw} V${
                  h * 0.8
                } H${w / 2 - w * bw} Z ` + // Body
                `M${w / 2 - w * bw * 7} ${h * 0.8} H${w / 2 + w * bw * 7} L${
                  w / 2
                } ${h * 0.7} Z` + // Tail
                `M${w * 0.4} ${h * 0.33} V${h * 0.26} M${w * 0.6} ${
                  h * 0.33
                } V${h * 0.26}` // engines
            )
            .stroke({ color: drawColor, opacity: 1.0, width: 1 })
            .fill(drawColor);
          break;
        case "Fighter Bomber":
          bw = 0.01; // vertical body line width
          svgSymbol
            .path(
              `M${w * 0.25} ${h * 0.33} H${w - w * 0.25} L${w / 2} ${
                h / 2
              } Z ` + // Wings
                `M${w / 2 - w * bw} ${h * 0.2} H${w / 2 + w * bw} V${
                  h * 0.8
                } H${w / 2 - w * bw} Z ` + // Body
                `M${w / 2 - w * bw * 7} ${h * 0.77} H${w / 2 + w * bw * 7} L${
                  w / 2
                } ${h * 0.67} Z` + // Tail
                `M${w * 0.4} ${h * 0.33} V${h * 0.2} H${
                  w * 0.4 - w * bw * 2
                } V${h * 0.33} Z ` +
                `M${w * 0.6} ${h * 0.33} V${h * 0.2} H${
                  w * 0.6 + w * bw * 2
                } V${h * 0.33} Z ` // engines
            )
            .stroke({ color: drawColor, opacity: 1.0, width: 1 })
            .fill(drawColor);
          break;
        case "Infantry":
          svgSymbol
            .line(0 + ra, 0 + ra, w - ra, h - ra)
            .stroke({ color: drawColor, opacity: 1.0, width: 1 });
          svgSymbol
            .line(0 + ra, h - ra, w - ra, 0 + ra)
            .stroke({ color: drawColor, opacity: 1.0, width: 1 });
          break;
        case "Headquarters":
          svgSymbol
            .plain("HQ")
            .font({
              family: "Helvetica",
              size: 15,
              fill: drawColor,
              weight: "normal",
            })
            .center(w / 2, h / 2);
          break;
        case "Hvy Artillery":
          rw = w * 0.57;
          rh = h * 0.4;
          svgSymbol
            .rect(rw, rh)
            .move(w / 2 - rw / 2, h / 2 - rh / 2)
            .fill(drawColor);
          break;
        case "Hvy Wpns":
          svgSymbol.rect(w * 0.13, h).fill(drawColor);
          break;
        case "Kampfgruppe":
          svgSymbol
            .plain("KG")
            .font({
              family: "Helvetica",
              size: 15,
              fill: drawColor,
              weight: "normal",
            })
            .center(w / 2, h / 2);
          break;
        case "Light Bomber":
          bw = 0.01; // vertical body line width
          svgSymbol
            .path(
              `M${w * 0.15} ${h * 0.2} H${w - w * 0.15} L${w / 2} ${
                h * 0.5
              } Z ` + // Wings
                `M${w / 2 - w * bw} ${h * 0.1} H${w / 2 + w * bw} V${
                  h * 0.9
                } H${w / 2 - w * bw} Z ` + // Body
                `M${w / 2 - w * bw * 9} ${h * 0.78} H${w / 2 + w * bw * 9} L${
                  w / 2
                } ${h * 0.87} Z` + // Tail
                `M${w * 0.4} ${h * 0.21} V${h * 0.1} H${
                  w * 0.4 - w * bw * 2
                } V${h * 0.21} Z ` +
                `M${w * 0.6} ${h * 0.21} V${h * 0.1} H${
                  w * 0.6 + w * bw * 2
                } V${h * 0.21} Z ` // engines
            )
            .stroke({ color: drawColor, opacity: 1.0, width: 1 })
            .fill(drawColor);
          break;
        case "Machine Gun":
          dotr = w * 0.1;
          svgSymbol
            .circle(dotr)
            .stroke({ color: drawColor, opacity: 1.0, width: 1 })
            .move(w / 2 - dotr / 2, h * 0.25 - dotr / 2)
            .fill(drawColor);
          svgSymbol
            .line(w / 2, h * 0.25, w / 2, h * 0.75)
            .stroke({ color: drawColor, opacity: 1.0, width: 1 });
          break;
        case "Mountain":
          svgSymbol
            .path(`M${w * 0.35} ${h} L${w / 2} ${h * 0.7} L${w * 0.65} ${h} Z`)
            .stroke({ color: drawColor, opacity: 1.0, width: 1 })
            .fill(drawColor);
          break;
        case "Motorized":
          dotr = w * 0.18;
          mora = ra * 0.75; // Slightly less adjustment for the dots so they hit the edges
          svgSymbol
            .circle(dotr)
            .stroke({ color: drawColor, opacity: 1.0, width: 1 })
            .move(0 + mora, h - dotr - mora)
            .fill(drawColor);
          svgSymbol
            .circle(dotr)
            .stroke({ color: drawColor, opacity: 1.0, width: 1 })
            .move(w - dotr - mora, h - dotr - mora)
            .fill(drawColor);
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
          console.log(
            "SymbolDraw.drawSymbol(): Unknown recipe element ",
            recipe[i]
          );
      }
    }
  }
}
