const store = new Map();

export const memoryParcelRepo = {
  async save(parcel) {
    store.set(parcel.id, JSON.parse(JSON.stringify(parcel)));
    return parcel;
  },
  async getById(id) {
    return store.get(id) || null;
  }
};
