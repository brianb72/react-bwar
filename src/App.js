import { useEffect, useRef, useMemo, useState } from "react";
import "./App.scss";
import { BWARController } from "./bwar/controller";
import TreeView from "./components/treeview/treeview.component";

function App() {
  const SVGWrapperRefElement = useRef(null);
  const HexSymbolRefElement = useRef(null);
  const UnitRefElement = useRef(null);
  const [headerTextMessage, setHeaderTextMessage] = useState(undefined);
  const [selectedUnitId, setSelectedUnitId] = useState(0);
  const [treeViewData, setTreeViewData] = useState([]);
  const [unitData, setUnitData] = useState({});
  const [hexData, setHexData] = useState({});

  const memoBWAR = useMemo(
    () =>
      new BWARController({
        setHeaderTextMessage,
        setTreeViewData,
        setSelectedUnitId,
        setUnitData,
        setHexData,
      }),
    []
  );

  // If the ref to the div changes, reattach BWAR
  useEffect(() => {
    console.log("useEffect[SVGWrapperRefElement]");
    if (
      SVGWrapperRefElement &&
      SVGWrapperRefElement?.current &&
      SVGWrapperRefElement?.current?.children.length < 1
    ) {
      console.log("   ...added to SVG");
      memoBWAR.attachView(SVGWrapperRefElement.current);
    } else {
      console.log("   ...did not add SVG");
    }
  }, [SVGWrapperRefElement, memoBWAR]);

  // If the selected unit in the treeview changes, tell bwar controller
  useEffect(() => {
    if (selectedUnitId === 0) {
      return;
    }
    memoBWAR.setSelectedUnitId(selectedUnitId);
    const unitRow = document.querySelectorAll(
      `[unitid="${selectedUnitId}"]`
    )[0];
    unitRow.scrollIntoView({ block: "center" });
  }, [selectedUnitId, memoBWAR]);

  // Update the Hex info box graphic
  useEffect(() => {
    if (HexSymbolRefElement && HexSymbolRefElement?.current) {
      HexSymbolRefElement.current.innerHTML = "";
      if (hexData && hexData.svgHex) {
        hexData.svgHex.addTo(HexSymbolRefElement.current);
      }
    }
  }, [HexSymbolRefElement, hexData]);

  // Update the Unit info box graphic
  useEffect(() => {
    if (UnitRefElement && UnitRefElement?.current) {
      UnitRefElement.current.innerHTML = "";
      if (unitData && unitData.svgUnit) {
        unitData.svgUnit.addTo(UnitRefElement.current);
      }
    }
  }, [UnitRefElement, unitData]);

  const clickCoordsButton = (e) => {
    memoBWAR.toggleShowCoordinates();
  };

  const blankSequence = "------";

  return (
    <div className="page-container">
      <div className="page-header">
        <span className="span-message">
          {memoBWAR && headerTextMessage ? headerTextMessage : "None"}
        </span>
      </div>
      <div className="page-content">
        <div className="main-svg" ref={SVGWrapperRefElement} />
        <div className="page-sidebar">
          <div className="page-unit">
            <div className="page-unit__left">
              <div className="unit-svg" ref={UnitRefElement}></div>
              <div>{unitData.symbolName || blankSequence}</div>
            </div>
            <div className="page-unit__right">
              <div>{unitData.forceName || blankSequence}</div>
              <div>{unitData.formationName || blankSequence}</div>
              <div>{unitData.unitName || blankSequence}</div>
              <div>{unitData.valueString || blankSequence}</div>
            </div>
          </div>

          <div className="page-hex">
            <div className="page-hex__left">
              <div className="hex-symbol" ref={HexSymbolRefElement}></div>
              <div className="hex-name">{hexData.terrainName}</div>
            </div>
            <div className="page-hex__right">
              <div>
                <div>Click + Drag: Pan</div>
                <div>Mouse Wheel: Zoom</div>
                <div>Single Click: Select</div>
                <div>Dbl Click: Move / Attack</div>
                <div>&nbsp;</div>
                <div>Click Unit From </div>
                <div>scrollable list to select.</div>
              </div>
            </div>
          </div>

          <div className="page-oob">
            <TreeView
              treeViewData={treeViewData}
              selectedUnitId={selectedUnitId}
              setSelectedUnitId={setSelectedUnitId}
            />
          </div>
        </div>
      </div>
      <div className="page-footer">
        <button onClick={clickCoordsButton}>Coords</button>
      </div>
    </div>
  );
}

export default App;
