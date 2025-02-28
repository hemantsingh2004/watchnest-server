import listModel, { IListDetails } from "./list.schema.ts";

const createList = async (listObj: IListDetails) => {
  return new Promise((reject, resolve) => {
    try {
      const list = listModel.create(listObj);
      if (list) resolve(list);
      reject(new Error("Unable to create list"));
    } catch (error) {
      reject(error);
    }
  });
};

export { createList };
