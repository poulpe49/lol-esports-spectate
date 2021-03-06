const LCUApiWrapper = require('./lcu_api_wrapper')
const { EventEmitter } = require('events')

class ChampSelectApi extends EventEmitter {

    constructor() {
        super()

        var _this = this
        var lastAction = 0
        var lastData = 0
        var lastActionIdx = 0
        this.api = new LCUApiWrapper()
        this.api.subscribe("OnJsonApiEvent_lol-champ-select_v1_session", function (data) {
            var actions = data.data.actions
            console.log(data)
            var latestActionIdx = actions.length - 1
            var latestAction = actions[latestActionIdx][0]
            for (var i = actions.length - 1; i >= 0; i--) {
                if (actions[i][0].isInProgress) {
                    latestAction = actions[i][0]
                    latestActionIdx = i
                    break
                }
            }
            console.log(latestAction)

            if (data.eventType == "Create") {
                console.log("Champ select started")
                _this.emit('championSelectStarted', data.data)

                _this.emit('banTurnBegin', latestAction.pickTurn)
                _this.emit('newTurnBegin', data.data.timer.adjustedTimeLeftInPhase/1000)
                var i;
                for (i = 0; i < data.data.myTeam.length; i++) {
                    emit('summonerSpellChanged', i, 1, data.data.myTeam[i].spell1Id)
                    emit('summonerSpellChanged', i, 2, data.data.myTeam[i].spell2Id)
                }
                for (i = 0; i < data.data.theirTeam.length; i++) {
                    _this.emit('summonerSpellChanged', i + 5, 1, data.data.theirTeam[i].spell1Id)
                    _this.emit('summonerSpellChanged', i + 5, 2, data.data.theirTeam[i].spell2Id)
                }
            }
            else if (data.eventType == "Update") {
                var cdata = data.data
                // console.log(data)
                console.log("last data:")
                console.log(lastData)

                _this.emit('newTurnBegin', cdata.timer.adjustedTimeLeftInPhase/1000)
                if (lastAction.id == latestAction.id) {
                    if (lastAction.championId != latestAction.championId) {
                        if (lastAction.type == "pick") {
                            //updateChampionHover(latestAction.championId, latestAction.actorCellId)
                            _this.emit('championHoverChanged', latestAction.championId, latestAction.actorCellId)
                        }
                    }
                    if (latestAction.completed) {
                        //detect trades
                        //TODO add new trade event
                        if (latestAction.type == "pick") {
                            _this.emit('championLocked', latestAction.championId, latestAction.actorCellId)
                        }
                        else if (latestAction.type == "ban") {
                            banTurn = latestAction.pickTurn
                            if (latestActionIdx > 6)
                                banTurn += 6
                            _this.emit('championBanned', latestAction.championId, banTurn)
                        }

                        for (i = 0; i < cdata.myTeam.length; i++) {
                            if (cdata.myTeam[i].championId != lastData.myTeam[i].championId) {
                                _this.emit('championChanged', cdata.myTeam[i].championId, cdata.myTeam[i].cellId)
                            }
                        }
                        for (i = 0; i < cdata.theirTeam.length; i++) {
                            if (cdata.theirTeam[i].championId != lastData.theirTeam[i].championId) {
                                _this.emit('championChanged', cdata.theirTeam[i].championId, cdata.theirTeam[i].cellId)
                            }
                        }
                    }
                }
                else {
                    _this.emit('newTurnBegin', cdata.timer.timeLeftInPhaseInSec)
                    if (latestActionIdx > 0 && actions[lastActionIdx][0].completed) {
                        if (lastAction.type == "pick") {
                            _this.emit('championLocked', actions[lastActionIdx][0].championId, actions[lastActionIdx][0].actorCellId)
                        }
                        else if (lastAction.type == "ban") {
                            banTurn = actions[lastActionIdx][0].pickTurn
                            if (latestActionIdx > 6)
                                banTurn += 6
                            _this.emit('championBanned', actions[lastActionIdx][0].championId, banTurn)
                        }
                    }
                    if (lastAction.type != latestAction.type) {
                        //onPhaseChange(latestAction.type)
                        _this.emit('phaseChanged', latestAction.type)
                    }
                    if (lastAction.isAllyAction != latestAction.isAllyAction) {
                        _this.emit('teamTurnChanged', latestAction.isAllyAction)
                    }

                    if (latestAction.type == "pick") {
                        //onPlayerTurn(latestAction.actorCellId)
                        _this.emit('playerTurnBegin', latestAction.actorCellId)
                    }
                    else if (latestAction.type == "ban") {
                        //onBanTurn(latestAction.pickTurn)
                        _this.emit('banTurnBegin', latestAction.pickTurn)
                    }

                    if (lastAction.type == "pick") {
                        _this.emit('playerTurnEnd', lastAction.actorCellId)
                    }
                    else if (lastAction.type == "ban") {
                        _this.emit('banTurnEnd', latestAction.pickTurn)
                    }
                }
                var i;
                for (i = 0; i < cdata.myTeam.length; i++) {
                    if (cdata.myTeam[i].spell1Id != lastData.myTeam[i].spell1Id) {
                        _this.emit('summonerSpellChanged', i, 1, cdata.myTeam[i].spell1Id)
                    }
                    if (cdata.myTeam[i].spell2Id != lastData.myTeam[i].spell2Id) {
                        _this.emit('summonerSpellChanged', i, 2, cdata.myTeam[i].spell2Id)
                    }
                }
                for (i = 0; i < cdata.theirTeam.length; i++) {
                    if (cdata.theirTeam[i].spell1Id != lastData.theirTeam[i].spell1Id) {
                        _this.emit('summonerSpellChanged', i + 5, 1, cdata.theirTeam[i].spell1Id)
                    }
                    if (cdata.theirTeam[i].spell2Id != lastData.theirTeam[i].spell2Id) {
                        _this.emit('summonerSpellChanged', i + 5, 2, cdata.theirTeam[i].spell2Id)
                    }
                }
            }
            lastData = data.data
            lastAction = latestAction
            lastActionIdx = latestActionIdx
        })
    }

    start() {
        this.api.start()
    }


    request(uri, callback) {
        this.api.request(uri, callback)
    }
}

module.exports = ChampSelectApi;