import bcrypt from "bcrypt";
const saltRounds = 10;

const hashPassword = async (password: string) => {
  return new Promise((resolve) => {
    resolve(bcrypt.hashSync(password, saltRounds));
  });
};

const comparePassword = async (password: string, hash: string) => {
  return new Promise((resolve) => {
    resolve(bcrypt.compareSync(password, hash));
  });
};

export { hashPassword, comparePassword };
