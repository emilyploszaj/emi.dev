/**
 * @abstract
 */
class Engine {

	/**
	 * @abstract
	 * @param {BattlePoke} attacker
	 * @param {BattlePoke} defender
	 * @param {BattleMove} move
	 * @return {CalcResult}
	 */
	getDamage(attacker, defender, move) {
		return CalcResult.of(0);
	}

	/**
	 * @returns {BattlePoke}
	 */
	createBattlePoke() {
		return new BattlePoke();
	}

	/**
	 * @returns {BattleMove}
	 */
	createBattleMove() {
		return new BattleMove();
	}

	getPokeStat(poke, stat) {
		if (poke.transformStats) {
			return poke.transformStats[stat];
		}
		var p = pokemonByName.get(poke.name);
		var v = p.stats[stat];
		if (poke.dvs != undefined) {
			v += poke.dvs[stat];
		} else {
			v += 15;
		}
		v = parseInt((v * 2 * poke.level) / 100);
	
		if (stat == "hp") {
			return v + poke.level + 10;
		} else {
			return v + 5;
		}
	}
}

/**
 * @type {Engine}
 */
var engine = new Engine();
