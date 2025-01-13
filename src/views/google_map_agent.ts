import { AgentFunction } from "graphai";

const googleMapAgent: AgentFunction<unknown, { result: string }, { arg: unknown; func: string }, { map: google.maps.Map }> = async ({
  namedInputs,
  config,
}) => {
  if (!config) {
    return { result: "failed" };
  }

  const { map } = config;
  const { arg, func } = namedInputs;
  if (map === null) {
    return { result: "faild" };
  }
  if (func === "setCenter") {
    map.setCenter(arg as google.maps.LatLng);
  }
  if (func === "setZoom") {
    map.setZoom((arg as { zoom: number }).zoom);
  }
  if (func === "setPin") {
    const { AdvancedMarkerElement } = (await google.maps.importLibrary("marker")) as google.maps.MarkerLibrary;
    /* eslint no-new: 0 */
    new AdvancedMarkerElement({
      map,
      position: arg as google.maps.LatLng,
    });
  }

  return { result: "success" };
};

const googleMapAgentInfo = {
  name: "googleMapAgent",
  agent: googleMapAgent,
  mock: googleMapAgent,
  samples: [],
  description: "",
  category: [],
  author: "",
  repository: "",
  tools: [
    {
      type: "function",
      function: {
        name: "googleMapAgent--setCenter",
        description: "set center location",
        parameters: {
          type: "object",
          properties: {
            lat: {
              type: "number",
              description: "latitude of center",
            },
            lng: {
              type: "number",
              description: "longtitude of center",
            },
          },
          required: ["lat", "lng"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "googleMapAgent--setZoom",
        description: "set zoom of google map",
        parameters: {
          type: "object",
          properties: {
            zoom: {
              type: "number",
              description: "zoom value",
            },
          },
          required: ["zoom"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "googleMapAgent--setPin",
        description: "set pin on map",
        parameters: {
          type: "object",
          properties: {
            lat: {
              type: "number",
              description: "latitude of pin",
            },
            lng: {
              type: "number",
              description: "longtitude of pin",
            },
          },
          required: ["lat", "lng"],
        },
      },
    },
  ],
  license: "",
};

export default googleMapAgentInfo;
