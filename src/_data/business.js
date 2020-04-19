module.exports = {
  name: 'E.V. Boone DDS',
  phone: '409-769-4433',
  address: {
    streetLevel1: '1090 N Main St',
    streetLevel2: '',
    locality: 'Vidor',
    region: 'TX',
    postalCode: '77662',
  },
  maps: {
    key: process.env.GOOGLE_MAPS_API_KEY,
    query: 'Boone+Eugene+V+DDS',
    center: '30.137678,-94.0162132',
  },
  yearsOpen: roundToNearest(new Date().getFullYear() - 1979, 5),
};

function roundToNearest(number, nearest) {
  return Math.floor(number / nearest) * nearest;
}
