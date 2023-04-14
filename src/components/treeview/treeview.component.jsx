import React from 'react'
import './treeview.styles.scss'


const TreeView = ({treeViewData, selectedUnitId, setSelectedUnitId}) => {
  const showForceRow = (force) => {
    const k = 'f' + force.forceId;
    return (
      <div className="tv-force" key={k}>{force.name} | {force.soft} - {force.hard} - {force.defense}</div>
    )
  }

  const showFormationRow = (formation) => {
    const k = 'fo' + formation.formationId;
    return (
      <div className="tv-formation" key={k}>{formation.name} | {formation.soft} - {formation.hard} - {formation.defense}</div>
    )
  }

  const clickUnitRow = (event) => {
    const unitId = Number.parseInt(event.target.attributes.unitid.value)
    if (Number.isInteger(unitId)) {
      setSelectedUnitId(unitId)
    }
  }

  const showUnitRow = (unit) => {
    const k = 'u' + unit.unitId;
    const cssClasses = unit.unitId === selectedUnitId ? "tv-unit tv-unit-selected" : "tv-unit";    
    return (
      <div className={cssClasses} onClick={clickUnitRow} unitid={unit.unitId} key={k}>{unit.name}  | {unit.soft} - {unit.hard} - {unit.defense}</div>
    )
  }

  const showRowSpacer = (id) => {
    const k = 'sp' + id;
    return (
      <div className="tv-row-spacer" key={k}></div>
    )
  }

  const buildTree = (data) => {
    const results = []
    let idx = 0;
    for (const side of data) {
      for (const force of side.forces) {
        results.push(showForceRow(force))
        for (const formation of force.formations) {
          results.push(showFormationRow(formation))
          for (const unit of formation.units) {
            results.push(showUnitRow(unit))
          }
        }
        results.push(showRowSpacer(idx++))
        results.push(showRowSpacer(idx++))
      }
    }
    return results
  }


  return (
    <div className="tv-container">
      {
        treeViewData 
        ?
          buildTree(treeViewData)
        : (
        <div>Hi</div>
        )
      }
    </div>
  )
}

export default TreeView