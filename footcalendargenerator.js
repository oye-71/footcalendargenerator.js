/** Reprensents the probability for a team to score {index} goals against a team of the same level */
const BaseScoringProb = [0.2, 0.45, 0.7, 0.85, 0.92, 0.97, 0.99, 1];

/** Max possible index of BaseScoringProb */
const MaxGoalPossible = BaseScoringProb.length - 1;

/** Increases or reduces the probability of scoring against a team of different level  */
const StrenghtsCoefficients = {
    0: {
        0: 0,
        1: 0.05,
        2: 0.15,
        3: 0.3,
        4: 0.5,
    },
    1: {
        0: -0.05,
        1: 0,
        2: 0.05,
        3: 0.15,
        4: 0.3,
    },
    2: {
        0: -0.15,
        1: -0.05,
        2: 0,
        3: 0.05,
        4: 0.15,
    },
    3: {
        0: -0.3,
        1: -0.15,
        2: -0.05,
        3: 0,
        4: 0.05,
    },
    4: {
        0: -0.5,
        1: -0.3,
        2: -0.15,
        3: -0.05,
        4: 0,
    },
};

/** Represents a football team in a round robin championship */
class Team {
    constructor(name, strength) {
        this.name = name;
        this.wins = 0;
        this.draws = 0;
        this.losses = 0;
        this.goalsFor = 0;
        this.goalsConc = 0;
        this.strength = strength ?? 2;
    }

    get points() {
        return this.wins * 3 + this.draws;
    }

    get played() {
        return this.wins + this.draws + this.losses;
    }

    get goalDiff() {
        return this.goalsFor - this.goalsConc;
    }

    toString() {
        return this.name;
    }

    /** Always returns a 20 char string */
    toFixedLenString() {
        return this.name.length > 20 ? this.name.slice(0, 19) + "." : this.name + " ".repeat(20 - this.name.length);
    }
}

/** Reprensnts a match between two teams in a round robin championship */
class Match {
    constructor(home, away) {
        this.teams = [home, away];
        this.homeTeam = home;
        this.awayTeam = away;
        this.homeScore = 0;
        this.awayScore = 0;
    }

    /** Returns result of the match. If draw, returns null */
    get result() {
        if (this.homeScore > this.awayScore) {
            return this.homeTeam;
        } else if (this.awayScore > this.homeScore) {
            return this.awayTeam;
        }
        return null;
    }

    /** Returns both teams & scores in one line */
    toString() {
        return `${this.homeTeam?.toString()} ${this.homeScore} - ${this.awayScore} ${this.awayTeam?.toString()}`;
    }
}

/** Builds and represents the match schedule in a round robin championship */
class Calendar {
    constructor(hasReturnGames, teams) {
        if (teams.length % 2 !== 0) {
            throw new Error("Odd number of teams not supported");
        }
        this.matchDays = this.roundRobin(hasReturnGames, teams);
    }

    /**  Builds the calendar following this method : https://en.wikipedia.org/wiki/Round-robin_tournament */
    roundRobin(hasReturnGames, teams) {
        const matchDays = [];
        const occurences = teams.length - 1;
        let pivot = teams[teams.length - 1];
        teams = teams.splice(0, teams.length - 1);

        // Build instance, rotate half pos.
        for (let i = 0; i < occurences; i++) {
            const md = [];
            md.push(new Match(pivot, teams[0]));
            for (let j = 1; j < (teams.length + 1) / 2; j++) {
                md.push(new Match(teams[j], teams[teams.length - j]));
            }
            matchDays.push(md);
            teams = this.rotate(teams);
        }

        if (hasReturnGames) {
            // Shuffle games
            let shuffled = matchDays
                .map((value) => ({ value, sort: Math.random() }))
                .sort((a, b) => a.sort - b.sort)
                .map(({ value }) => value);

            // Invert home & aways
            shuffled = shuffled.map((md) => md.map((m) => new Match(m.awayTeam, m.homeTeam)));

            return [...matchDays, ...shuffled];
        }

        return matchDays;
    }

    /** Rotates teams in the way of algorithm: teams.length/2 each time */
    rotate(teams) {
        const pivotPos = (teams.length + 1) / 2;
        const newTeams = [];
        for (let i = 0; i < pivotPos; i++) {
            newTeams[i] = teams[pivotPos - 1 + i];
        }
        for (let i = 0; i < pivotPos - 1; i++) {
            newTeams[pivotPos + i] = teams[i];
        }
        return newTeams;
    }

    /** Returns calendar by indicating for each match day all games & scores. */
    toString() {
        if (!this.matchDays) return "No games";

        let str = "";
        for (let [index, day] of this.matchDays.entries()) {
            str += `--- MATCH DAY ${index + 1} ---\n`;
            for (let match of day) {
                str += `${match?.toString()} \n`;
            }
            str += "\n";
        }
        return str;
    }
}

/** Builds and represents a football round robin championship */
class Championship {
    constructor(hasReturnGames, ...teams) {
        this.teams = Array.from(teams);
        this.calendar = new Calendar(hasReturnGames, teams);
    }

    /** Returns teams sorted by position in the table */
    get rankings() {
        return this.teams.sort((a, b) => {
            if (a.points !== b.points) {
                return b.points - a.points;
            } else if (a.goalDiff !== b.goalDiff) {
                return b.goalDiff - a.goalDiff;
            } else if (a.goalsFor !== b.goalsFor) {
                return b.goalsFor - a.goalsFor;
            }
        });
    }

    /** Simulate all football games in the championship */
    simulateAllGames() {
        for (let day of this.calendar.matchDays) {
            for (let match of day) {
                match.homeScore = new ScoreGenerator(match).homeScore;
                match.homeTeam.goalsFor += match.homeScore;
                match.awayTeam.goalsConc += match.homeScore;
                match.awayScore = new ScoreGenerator(match).awayScore;
                match.awayTeam.goalsFor += match.awayScore;
                match.homeTeam.goalsConc += match.awayScore;
                if (match.result) {
                    match.result.wins++;
                    match.teams.find((t) => t !== match.result).losses++;
                } else {
                    match.homeTeam.draws++;
                    match.awayTeam.draws++;
                }
            }
        }
    }

    /** If num is smaller than 3 characters then return number to string with spaces before */
    numToString3(num) {
        switch (num.toString().length) {
            case 1:
                return " ".repeat(2) + num.toString();
            case 2:
                return " ".repeat(1) + num.toString();
            default:
                return num.toString();
        }
    }

    /** Returns the result table of the championship as a string */
    toString() {
        return this.rankings.reduce((previous, current) => {
            return (
                previous +
                current.toFixedLenString() +
                this.numToString3(current.points) +
                " " +
                this.numToString3(current.wins) +
                " " +
                this.numToString3(current.draws) +
                " " +
                this.numToString3(current.losses) +
                " " +
                this.numToString3(current.goalsFor) +
                " " +
                this.numToString3(current.goalsConc) +
                " " +
                this.numToString3(current.goalDiff) +
                "\n"
            );
        }, "TEAM                Pts Win Dra Los GoF GoC Dif\n------------------------------------------------\n");
    }
}

/** Instanciating this class with a match  */
class ScoreGenerator {
    constructor(match) {
        if (!match || !match.homeTeam || !match.awayTeam) {
            throw new Error("Cannot compute score if no match or match teams not fullfilled");
        }
        const homeStr = match.homeTeam.strength ?? 2;
        const awayStr = match.awayTeam.strength ?? 2;

        // Randomize home team score
        this.homeScore = this.computeScore(homeStr, awayStr);

        // Randomize away team score
        this.awayScore = this.computeScore(awayStr, homeStr);
    }

    /** Transforms the base scoring probability by applying level coefficients */
    transform(forStren, versusStren) {
        const computedProb = BaseScoringProb.map((prob, index) => {
            const cpt = (1 + StrenghtsCoefficients[forStren][versusStren] / ((index + 1 * 3) / 4)) * prob;
            return cpt < 1 && index !== MaxGoalPossible ? cpt : 1;
        });
        return computedProb;
    }

    /** Computes score by mapping a pseudo-random number to a probability array build depending strenghts of match's teams */
    computeScore(forStren, versusStren) {
        const seed = Math.random();
        const probs = this.transform(forStren, versusStren);

        let index =
            probs.find((value, index, array) => {
                if (index === 0) {
                    return seed <= array[0];
                } else {
                    return array[index - 1] < seed && seed <= array[index + 1];
                }
            }) ?? 0;
        return probs.indexOf(index);
    }
}

// Tests Section
let teams = [
    new Team("France", 3),
    new Team("Brésil", 4),
    new Team("Allemagne", 3),
    new Team("Argentine", 3),
    new Team("Espagne", 3),
    new Team("Angleterre", 3),
    new Team("Sénégal", 2),
    new Team("Italie", 3),
];
let championship = new Championship(true, ...teams);

championship.simulateAllGames();

console.log(championship.calendar.toString());
console.log(championship.toString());
