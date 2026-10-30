import rawDataset from "../../public/data/catalogue.json";
import { datasetSchema } from "./schema";

export const catalogue = datasetSchema.parse(rawDataset);
