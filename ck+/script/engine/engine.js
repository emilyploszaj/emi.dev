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
		v += poke.dvs?.[stat] ?? MAX_DV;
		v = parseInt((v * 2 * poke.level) / 100);
	
		if (stat == "hp") {
			return v + poke.level + 10;
		} else {
			return v + 5;
		}
	}


	getHiddenPower(poke) {
		function mod4(stat) {
			return (getDv(poke, stat) & 0b11);
		}
		function mSig(stat) {
			return (getDv(poke, stat) & 0b1000) >> 3;
		}
		var t = (mod4("atk") << 2) | mod4("def");
		var types = [
			"fighting", "flying", "poison", "ground",
			"rock", "bug", "ghost", "steel",
			"fire", "water", "grass", "electric",
			"psychic", "ice", "dragon", "dark"
		];
		var ty = types[t];
		var po = (((mSig("spa") + 2 * mSig("spe") + 4 * mSig("def") + 8 * mSig("atk")) * 5 + mod4("spa")) >> 1) + 31;
		return { type: ty, power: po };
	}
}

/**
 * @type {Engine}
 */
var engine = new Engine();
