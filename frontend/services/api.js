import axios from 'axios';

const BASE_URL = 'http://192.168.1.8:5000'; //thay đổi cho phù hợp với ip của máy bạn

export const getFoodList = () => axios.get(`${BASE_URL}/api/foods`);
export const login = (email, password) => axios.post(`${BASE_URL}/api/login`, { email, password });
