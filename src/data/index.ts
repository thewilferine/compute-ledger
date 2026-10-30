import { datasetSchema, type Dataset } from "./schema";

export async function loadCatalogue(): Promise<Dataset> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/catalogue.json`);
  if (!response.ok) {
    throw new Error(`Unable to load the data catalogue (${response.status}).`);
  }

  const rawData: unknown = await response.json();
  return datasetSchema.parse(rawData);
}
