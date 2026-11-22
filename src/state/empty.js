// UI defaults for an empty catalogue. This is not a historical record.
export const emptyContext = {
  id: '', kind: 'chapter', labels: {de: 'Der Atlas beginnt hier', en: 'The atlas starts here'},
  focusIds: [], initialState: {
    time: {kind: 'unknown'}, layers: [],
    camera: {longitude: 4, latitude: 35, metersPerPixel: 50000, bearing: 0, pitch: 0}
  }
};
