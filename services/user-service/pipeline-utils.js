const leagueRank = {0: "Stone", 1000: "Iron", 1250: "Silver", 1500: "Gold", 1750: "Platinum", 2000: "Diamond"};

/**
 * Returns an object that can be injected into the branches property of a $switch in MongoDB
 * to perform a switch-case operation on a value.
 *
 * @param {string} field - The field of the document used for the comparison.
 * @return {{then: *, case: {$gte: [*, number]}}[]} - Object to inject into the branches' property.
 */
function branches(field) {
    return Object.keys(leagueRank).reverse().map(elo => ({
        case: {$gte: [field, parseInt(elo)]},
        then: leagueRank[elo]
    }));
}

/**
 * Returns an object that can be injected into the $switch operation in MongoDB
 * to perform a switch-case operation on a value.
 *
 * @param {string} field - The field of the document used for the comparison.
 * @return {{default: string, branches: {then: *, case: {$gte: [*, number]}}[]}} - The object to inject into $switch.
 */
function switchOptions(field) {
    return {branches: branches(field), default: "wood"};
}

/**
 * An object that can be injected into a MongoDB aggregation pipeline
 * to sort a list of players by ELO score in descending order.
 *
 * @type {{$addFields: {players: {$sortArray: {input: string, sortBy: {elo: number}}}}}}
 * The object to inject into the pipeline.
 */
const orderByEloPipeline = {
    $addFields: {
        players: {
            $sortArray: {
                input: "$players",
                sortBy: {elo: -1}
            }
        }
    }
};

/**
 * An object that can be injected into a MongoDB aggregation pipeline
 * to add the rank of a player within their league based on ELO score.
 *
 * @type {{$addFields: {players: {$map: {input: string, as: string, in: {league: string, leagueRank: {$add: [{$size: {$filter: {input: string, as: string, cond: {$gt: string[]}}}},number]}, name: string, elo: string, _id: string}}}}}}
 * The object to inject into the pipeline.
 */
const addRankPipeline = {
    $addFields: {
        players: {
            $map: {
                input: "$players",
                as: "player",
                in: {
                    _id: "$$player._id",
                    name: "$$player.name",
                    elo: "$$player.elo",
                    league: "$$player.league",
                    leagueRank: {
                        $add: [
                            {
                                $size: {
                                    $filter: {
                                        input: "$players",
                                        as: "other",
                                        cond: {$gt: ["$$other.elo", "$$player.elo"]}
                                    }
                                }
                            },
                            1
                        ]
                    }
                }
            }
        }
    }
};

/**
 * Returns an object that can be injected into a MongoDB aggregation pipeline
 * to group players by a specified field.
 *
 * @param {string} field - The field by which to group the players.
 * @return {{$group: {players: {$push: {league: string, name: string, elo: string, _id: string}}, _id}}}
 * The aggregation pipeline object to group players.
 */
function groupPipelineCreation(field) {
    return {
        $group: {
            _id: field,
            players: {
                $push: {
                    _id: "$_id",
                    name: "$name",
                    elo: "$elo",
                    league: "$league"
                }
            }
        }
    };
}

module.exports = {
    leagueRank,
    switchOptions,
    orderByEloPipeline,
    addRankPipeline,
    groupPipelineCreation
};