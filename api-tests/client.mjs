import axios from "axios";

export function createApi(baseURL) {
  // Preserve 4xx/5xx responses so negative cases can assert status and body.
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
