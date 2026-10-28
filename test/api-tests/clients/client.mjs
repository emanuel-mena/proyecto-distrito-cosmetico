import axios from "axios";

export function createApi(baseURL) {

  const api = axios.create({
    baseURL,
    timeout: 10_000,
    proxy: false,
    validateStatus: () => true,
  });
  const as = (token) =>
    axios.create({
      baseURL,
      timeout: 10_000,
      proxy: false,
      validateStatus: () => true,
      headers: { Authorization: `Bearer ${token}` },
    });
  return { api, as };
}
