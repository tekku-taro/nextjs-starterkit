// 1. Initialize SmartAuth (lib/auth.ts)
import config from '../smartauth.config';
import { configure } from './smart-auth';

export const smartauth = configure(config);