import dayjs from "dayjs"
import utc from "dayjs/plugin/utc.js"
import Fastify from "fastify"
import fetch from "node-fetch"
import StatusCodes from "http-status-codes"

dayjs.extend(utc)

const fastify = Fastify({
  logger: true
})

fastify.register(import("fastify-cors"))

let interventions = []

const fetchAndTransformInterventions = async () => {
  const pocsagSouthTyrolApiUrl = `https://pocsagsuedtirol.it/api/v1/ae?api_token=${process.env.POCSAG_SOUTH_TYROL_TOKEN}`

  try {
    const getInterventionsResponse = await fetch(pocsagSouthTyrolApiUrl)
    const getInterventionsResult = await getInterventionsResponse.json()

    if (!getInterventionsResponse.ok || getInterventionsResult.status !== StatusCodes.OK) {
      return
    }

    interventions = getInterventionsResult.data.map((intervention) => ({
      alarmLevel: intervention.ALARMSTUFE ? intervention.ALARMSTUFE : null,
      district: intervention.BEZIRK ? intervention.BEZIRK : null,
      date: intervention.DATUM ? dayjs(intervention.DATUM).utc().toISOString() : null,
      latitude: intervention.LAT ? intervention.LAT : null,
      longitude: intervention.LNG ? intervention.LNG : null,
      organization: intervention.ORGANISATION ? intervention.ORGANISATION : null,
      loop: intervention.SCHLEIFE ? intervention.SCHLEIFE : null,
      keyword: intervention.STICHWORT ? intervention.STICHWORT : null,
      subkeyword: intervention.UNTERSTICHWORT ? intervention.UNTERSTICHWORT : null,

    }))
  } catch (error) {
    fastify.log.error(error)

    return
  }
}

await fetchAndTransformInterventions()
setInterval(fetchAndTransformInterventions, 60000);

fastify.get("/interventions", async (_, reply) => {
  return {
    success: true,
    interventions
  }
})

await fastify.listen(5000)