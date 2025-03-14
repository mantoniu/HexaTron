const leagueRank = {0: "Stone", 1000: "Iron", 1250: "Silver", 1500: "Gold", 1750: "Platinum", 2000: "Diamond"};

const branches = Object.keys(leagueRank).reverse().map(elo => ({
    case: {$gte: ["$elo", parseInt(elo)]},
    then: leagueRank[elo]
}));

const switchOptions = {
    branches: branches,
    default: "wood"
};

const addEloPipeline = {
    $addFields: {
        players: {
            $sortArray: {
                input: "$players",
                sortBy: {elo: -1}
            }
        }
    }
};

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

function groupPipelineCreation(id) {
    return {
        $group: {
            _id: id,
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
    addEloPipeline,
    addRankPipeline,
    groupPipelineCreation
};