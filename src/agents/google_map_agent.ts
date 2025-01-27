import { AgentFunction } from "graphai";

const googleMapAgent: AgentFunction<unknown, { result: string }, { arg: unknown; func: string }, { map: google.maps.Map | null }> = async ({
  namedInputs,
  config,
}) => {
  if (!config) {
    return { result: "failed" };
  }
  const { AdvancedMarkerElement } = (await google.maps.importLibrary("marker")) as google.maps.MarkerLibrary;

  const { map } = config;
  const { arg, func } = namedInputs;
  if (map === null) {
    return { result: "faild" };
  }
  if (func === "setCenter") {
    map.setCenter(arg as google.maps.LatLng);
  }
  if (func === "getCenter") {
    const location = map.getCenter();
    return {
      result: JSON.stringify(location),
      hasNext: true,
    };
  }
  if (func === "setZoom") {
    map.setZoom((arg as { zoom: number }).zoom);
  }
  if (func === "setPin") {
    /* eslint no-new: 0, sonarjs/constructor-for-side-effects: 0 */
    new AdvancedMarkerElement({
      map,
      position: arg as google.maps.LatLng,
    });
  }

  if (func === "findPlaces") {
    const center = map.getCenter();

    const { Place } = (await google.maps.importLibrary("places")) as google.maps.PlacesLibrary;

    const request = {
      textQuery: (arg as {textQuery: string}).textQuery,
      fields: ["displayName", "location", "businessStatus", "formattedAddress"],
      includedType: (arg as {includedType: string}).includedType,
      locationBias: center,
      isOpenNow: true,
      language: "ja-JP",
      maxResultCount: 8,
      minRating: 3.2,
      region: "jp",
      useStrictTypeFiltering: false,
    };
    const { places } = await Place.searchByText(request);

    if (places.length) {
      const { LatLngBounds } = (await google.maps.importLibrary("core")) as google.maps.CoreLibrary;
      const bounds = new LatLngBounds();

      // Loop through and get all the results.
      const dataSet = places.map((place) => {
        new AdvancedMarkerElement({
          map,
          position: place.location,
          title: place.displayName,
        });

        bounds.extend(place.location as google.maps.LatLng);
        return { name: place.displayName, address: place.formattedAddress };
      });

      map.fitBounds(bounds);

      return {
        result: JSON.stringify(dataSet),
        hasNext: true,
      };
    }
  }

  if (func === "movePlaces") {
    const center = map.getCenter();

    const { Place } = (await google.maps.importLibrary("places")) as google.maps.PlacesLibrary;

    const request = {
      textQuery: (arg as {textQuery: string}).textQuery,
      fields: ["displayName", "location", "businessStatus", "formattedAddress"],
      includedType: (arg as {includedType: string}).includedType,
      locationBias: center,
      isOpenNow: true,
      language: "ja-JP",
      maxResultCount: 8,
      minRating: 3.2,
      region: "jp",
      useStrictTypeFiltering: false,
    };
    const { places } = await Place.searchByText(request);

    if (!places.length || places.length === 0 || !places[0].location) {
      return { result: "faild" };
    }
    map.setCenter(places[0].location);
    map.setZoom(15);
  }

  return { result: "success" };
};

const mapTypes = [
  "accounting",
  "airport",
  "amusement_park",
  "aquarium",
  "art_gallery",
  "atm",
  "bakery",
  "bank",
  "bar",
  "beauty_salon",
  "bicycle_store",
  "book_store",
  "bowling_alley",
  "bus_station",
  "cafe",
  "campground",
  "car_dealer",
  "car_rental",
  "car_repair",
  "car_wash",
  "casino",
  "cemetery",
  "church",
  "city_hall",
  "clothing_store",
  "convenience_store",
  "courthouse",
  "dentist",
  "department_store",
  "doctor",
  "drugstore",
  "electrician",
  "electronics_store",
  "embassy",
  "fire_station",
  "florist",
  "funeral_home",
  "furniture_store",
  "gas_station",
  "gym",
  "hair_care",
  "hardware_store",
  "hindu_temple",
  "home_goods_store",
  "hospital",
  "insurance_agency",
  "jewelry_store",
  "laundry",
  "lawyer",
  "library",
  "light_rail_station",
  "liquor_store",
  "local_government_office",
  "locksmith",
  "lodging",
  "meal_delivery",
  "meal_takeaway",
  "mosque",
  "movie_rental",
  "movie_theater",
  "moving_company",
  "museum",
  "night_club",
  "painter",
  "park",
  "parking",
  "pet_store",
  "pharmacy",
  "physiotherapist",
  "plumber",
  "police",
  "post_office",
  "primary_school",
  "real_estate_agency",
  "restaurant",
  "roofing_contractor",
  "rv_park",
  "school",
  "secondary_school",
  "shoe_store",
  "shopping_mall",
  "spa",
  "stadium",
  "storage",
  "store",
  "subway_station",
  "supermarket",
  "synagogue",
  "taxi_stand",
  "tourist_attraction",
  "train_station",
  "transit_station",
  "travel_agency",
  "university",
  "veterinary_care",
  "zoo",
]

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
        name: "googleMapAgent--getCenter",
        description: "get center location",
        parameters: {
          type: "object",
          properties: {},
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
    {
      type: "function",
      function: {
        name: "googleMapAgent--findPlaces",
        description: "search place on map by user query",
        parameters: {
          type: "object",
          properties: {
            textQuery: {
              type: "string",
              description: "search query",
            },
            includedType: {
              type: "string",
              description: "google map includedType",
              enum: mapTypes,
            },
          },
          required: ["textQuery", "includedType"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "googleMapAgent--movePlaces",
        description: "move place on map by user query",
        parameters: {
          type: "object",
          properties: {
            textQuery: {
              type: "string",
              description: "search query",
            },
            includedType: {
              type: "string",
              description: "google map includedType",
              enum: mapTypes,
            },
          },
          required: ["textQuery", "includedType"],
        },
      },
    },
  ],
  license: "",
};

export default googleMapAgentInfo;
