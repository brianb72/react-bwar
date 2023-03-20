/*

    CombatEngine manages combat between multiple units.

    Units are either "soft" like Infantry, or "hard" like tanks.
    Units have soft attack and hard attack value.
    Units have one defense value.
    A unit uses it's soft attack value to attack a soft unit.
    A unit uses it's hard attack value to attack a hard unit.
    Units have a percentCondition value from 0.0 to 1.0.
    A Units attack and defense values scale with its percentCondition.
    Attack values are displayed on the bottom of each counter as "SoftAttack - HardAttack - Defend"
    
    Combat Steps 1v1
       "5-5-5" Hard Tank attacks "5-1-5" Soft Infantry
       Attacking Tank Soft Attack 5 / Defending Infantry 5 = 1.00 (capped at 0.90)
       Defending Infantry Hard Attack 1 / Defending Tank 5 = 0.20
       Tank has 90% chance of succesfully attacking.
       Infantry has 20% chance of successfully attacking.
       Tank Success, Infantry Success: Both units lose percentCondition.
                                       Tank has chance to do more damage.
       Tank Success, Infantry Failure: Infantry destroyed.
       Tank Failure, Infantry Failure: Both units lose percentCondition.
*/

export class CombatEngine {
  constructor(model) {
    this.model = model;
    this.oob = this.model.oob;
  }

  /**
   * Combat between two units
   * @param {UnitId} attUnitId Attacking Unit
   * @param {UnitId} defUnitId Defending Unit
   * @returns {Object} Dictionary of combat results
   */
  combatSingle(attUnitId, defUnitId) {
    // Get both units
    const oob = this.oob;
    const attUnit = oob.getUnit(attUnitId);
    const defUnit = oob.getUnit(defUnitId);

    // Test for errors
    if (attUnit === undefined) {
      throw new Error(
        `CombatEngine.combatSingle(): attacker not found [${JSON.stringify(
          attUnitId
        )}]`
      );
    }
    if (defUnit === undefined) {
      throw new Error(
        `CombatEngine.combatSingle(): defender not found [${JSON.stringify(
          defUnitId
        )}]`
      );
    }
    if (
      attUnit.values.unitType !== "Soft" &&
      attUnit.values.unitType !== "Hard"
    ) {
      throw new Error(
        `CombatEngine.combatSingle(): attacker unitType unknown [${JSON.stringify(
          attUnit
        )}]`
      );
    }
    if (
      defUnit.values.unitType !== "Soft" &&
      defUnit.values.unitType !== "Hard"
    ) {
      throw new Error(
        `CombatEngine.combatSingle(): defender unitType unknown [${JSON.stringify(
          defUnit
        )}]`
      );
    }

    console.log(
      `Combat between ${attUnitId}: ${attUnit.hexCoord.x}, ${attUnit.hexCoord.y} and ${defUnitId}: ${defUnit.hexCoord.x}, ${defUnit.hexCoord.y}`
    );

    // Each unit attacks with the hard or soft value of the other unit
    let attAttackValue =
      defUnit.values.unitType === "Soft"
        ? attUnit.values.attackSoft
        : attUnit.values.attackHard;
    let defAttackValue =
      attUnit.values.unitType === "Soft"
        ? defUnit.values.attackSoft
        : defUnit.values.attackHard;
    let attDefendValue = attUnit.values.defense;
    let defDefendValue = defUnit.values.defense;

    // The values scale with percentCondition
    attAttackValue *= attUnit.values.percentCondition;
    defAttackValue *= defUnit.values.percentCondition;
    attDefendValue *= attUnit.values.percentCondition;
    defDefendValue *= defUnit.values.percentCondition;

    // Find each units chance of winning, with a 90% ceiling.
    const attSuccessPercent = Math.min(attAttackValue / defDefendValue, 0.9);
    const defSuccessPercent = Math.min(defAttackValue / attDefendValue, 0.9);

    /*
            Each unit rolls dice to see if it succeeds in the combat
            Math.random() <= (0 / 0) = false    If both sides 0, both always lose
            Math.random() <= (1 / 0) = true     If defenseer 0, attacker always wins
    */
    const didAttSucceed = Math.random() <= attSuccessPercent;
    const didDefSucceed = Math.random() <= defSuccessPercent;
    let attResultCondition = attUnit.values.percentCondition;
    let defResultCondition = defUnit.values.percentCondition;

    if (didAttSucceed && didDefSucceed) {
      // If both units succeed, they damage each other. The unit with a higher chance of winning has a chance of doing more damage
      // scaled by the gap between percents
      if (attSuccessPercent > defSuccessPercent && Math.random() >= (attSuccessPercent - defSuccessPercent)) {
        // The attacker had a higher percent chance of winning and won a roll to do more damage
        attResultCondition -= 0.25;
        defResultCondition -= 0.50;
        console.log('   Tie, Atk does bonus dmg')
      } else if (attSuccessPercent < defSuccessPercent && Math.random() >= (defSuccessPercent - attSuccessPercent)) {
        // The defender had a higher percent chance of winning and won a roll to do more damage
        attResultCondition -= 0.55;
        defResultCondition -= 0.25;
        console.log('  Tie, Def does bonus dmg')
      } else {
        // Attacker and defender had same chance of winning, each has a 50% chance of taking more damage
        const attAdjust = Math.random() < 0.50 ? 0.25 : 0.50;
        const defAdjust = Math.random() < 0.50 ? 0.25 : 0.50;

        console.log(`   Even Tie, att ${attAdjust} def ${defAdjust}`)
        attResultCondition -= attAdjust;
        defResultCondition -= defAdjust;
      }
    } else if (didAttSucceed && !didDefSucceed) {
      // Attacker succeeded, defender failed, defender destroyed
      defResultCondition = 0;
    } else if (!didAttSucceed && didDefSucceed) {
      // Attacker failed, defender succeeded, attacker destroyed
      attResultCondition = 0;
    } else {
      // Both units failed and take more damage
      attResultCondition -= 0.5;
      defResultCondition -= 0.5;
    }

    console.log(
      `   Att: ${
        didAttSucceed ? "Won" : "Lost"
      }, ${attAttackValue}-${attDefendValue}, ${Math.round(
        attSuccessPercent * 100
      )}%, Cond: ${attResultCondition}`
    );
    console.log(
      `   Def: ${
        didDefSucceed ? "Won" : "Lost"
      }, ${defAttackValue}-${defDefendValue}, ${Math.round(
        defSuccessPercent * 100
      )}%, Cond: ${defResultCondition}`
    );

    return {
      didAttSucceed,
      attResultCondition,
      didDefSucceed,
      defResultCondition,
      attUnit,
      defUnit,
    };
  }
}
