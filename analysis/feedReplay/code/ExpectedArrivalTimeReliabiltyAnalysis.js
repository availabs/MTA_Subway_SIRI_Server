'use strict' 


const process = require('process')
const ss      = require('simple-statistics') 


let chain = {}
let etaChanges = {
  weekday: {
    '6am_to_10am': [],
    '10am_to_4pm': [],
    '4pm_to_8pm':  [],
    'offpeak':     [],
  },

  weekend: {
    '6am_to_8pm': [],
    'offpeak':    [],
  },
}

let recordedAtTimes = {}


function feedListener (err, gtfsrtJSON, siriJSON, converterCache) {
  if (err) {
    return console.err(err.stack || err)
  }

  let newChain = {}

  let validUntilTimestamp = siriJSON.Siri.ServiceDelivery.VehicleMonitoringDelivery[0].ValidUntil
  let respDateObj = new Date(validUntilTimestamp)
  
  respDateObj.setSeconds(respDateObj.getSeconds() - 30);
  respDateObj.setHours(respDateObj.getHours() + 4);

  let dayOfWeek = respDateObj.getDay()
  let hour      = respDateObj.getHours()

  let timeSpan

  if (dayOfWeek % 6) {
    if ((hour >=6) && (hour < 10)) {
      timeSpan = etaChanges.weekday['6am_to_10am']
    } else if ((hour >= 10) && (hour < 16)) {
      timeSpan = etaChanges.weekday['10am_to_4pm']
    } else if ((hour >= 16) && (hour < 20)) {
      timeSpan = etaChanges.weekday['4pm_to_8pm']
    } else {
      timeSpan = etaChanges.weekday['offpeak']
    }
  } else {
    if ((hour >=6) && (hour < 20)) {
      timeSpan = etaChanges.weekend['6am_to_8pm']
    } else {
      timeSpan = etaChanges.weekend['offpeak']
    }
  }


  var vehicleActivity = siriJSON.Siri.ServiceDelivery.VehicleMonitoringDelivery[0].VehicleActivity

  vehicleActivity.forEach((vehAct) => {
      let vehicleRef = vehAct.MonitoredVehicleJourney.VehicleRef
      let recordedAtTime = vehAct.RecordedAtTime

      let previousPair = chain[vehicleRef]

      let nextStop = vehAct.MonitoredVehicleJourney.MonitoredCall.StopPointRef
      let nextETA = new Date(vehAct.MonitoredVehicleJourney.MonitoredCall.ExpectedArrivalTime).getTime()

      if ((recordedAtTime !== recordedAtTimes[vehicleRef]) && (previousPair && (previousPair.stop === nextStop))) {
        timeSpan.push(Math.abs(previousPair.eta - nextETA) / 1000)
      } else {
        newChain[vehicleRef] = { stop: nextStop, eta: nextETA }
      }

      recordedAtTimes[vehicleRef] = recordedAtTime
  }) 

  chain = newChain
}


module.exports = feedListener 

const computeSummaryStats = (timeSpanArr) => {
  timeSpanArr.sort((a,b) => (+a - +b))

  return {
    mean              : ss.mean(timeSpanArr),
    max               : ss.max(timeSpanArr),
    variance          : ss.variance(timeSpanArr),
    standardDeviation : ss.standardDeviation(timeSpanArr),

    eightiethOverFiftieth : (ss.quantileSorted(timeSpanArr, 0.8) / ss.quantileSorted(timeSpanArr, 0.5)),
  }
}

const finito = () => {
  var analysis = {
    weekday: {
      '6am_to_10am' : computeSummaryStats(etaChanges.weekday['6am_to_10am']),
      '10am_to_4pm' : computeSummaryStats(etaChanges.weekday['10am_to_4pm']),
      '4pm_to_8pm'  : computeSummaryStats(etaChanges.weekday['4pm_to_8pm']),
      'offpeak'     : computeSummaryStats(etaChanges.weekday['offpeak']),
    },

    weekend: {
      '6am_to_8pm'  : computeSummaryStats(etaChanges.weekend['6am_to_8pm']),
      'offpeak'     : computeSummaryStats(etaChanges.weekend['offpeak']),
    },
  } 

  require('fs').writeFileSync('ETA_ReliabilityAnalysisResults.json', JSON.stringify(analysis, null, 4))
  process.exit()
}

// NOTE: Uses process' exit event to trigger analysis.
// TODO: Find a better way of doing this.
process.on('exit', finito)
process.on('SIGINT', finito)

