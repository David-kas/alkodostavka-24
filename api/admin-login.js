import { handleAdminLogin } from './catalog.js';

export default function handler(req, res) {
  return handleAdminLogin(req, res);
}
