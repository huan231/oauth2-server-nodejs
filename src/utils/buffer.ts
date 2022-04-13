import { Buffer } from 'buffer';

export const base64url = (data: Parameters<typeof Buffer['from']>[0]) => Buffer.from(data).toString('base64url');
