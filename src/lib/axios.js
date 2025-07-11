import Axios from "axios";

const axios = Axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL + "/api",
  headers: {
    "X-Requested-With": "XMLHttpRequest",
    Accept: "application/json",
  },
  withCredentials: true,
  withXSRFToken: true,
});


const initializeCsrf = async () => {
  await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/sanctum/csrf-cookie`);
};

export { axios, initializeCsrf };